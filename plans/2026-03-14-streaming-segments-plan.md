# Streaming Segments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable incremental segment streaming so VN-style components can display segments as they're generated, rather than waiting for the full LLM response.

**Architecture:** Add a `StructuredResponseParser` to the engine that parses JSON-format LLM responses (backward-compatible — regex parser used for non-JSON). Add an `IncrementalSegmentExtractor` that detects completed segment objects mid-stream. Server emits new SSE events (`segment`, `bg`) as segments complete. Client accumulates streaming segments and passes them to custom components.

**Tech Stack:** TypeScript, Vitest (engine tests), Hono SSE (server), Zustand (client store), React (components)

---

### Task 1: StructuredResponseParser (Engine)

**Files:**
- Create: `packages/engine/src/parser/structured-response-parser.ts`
- Create: `packages/engine/src/__tests__/structured-response-parser.test.ts`
- Modify: `packages/engine/src/index.ts`

**Step 1: Write tests**

```typescript
// packages/engine/src/__tests__/structured-response-parser.test.ts
import { describe, it, expect } from "vitest";
import { StructuredResponseParser } from "../parser/structured-response-parser.js";

describe("StructuredResponseParser", () => {
  const parser = new StructuredResponseParser();

  describe("isStructuredResponse", () => {
    it("returns true for valid JSON with narrative + stateChanges", () => {
      const json = JSON.stringify({
        narrative: "The hero enters.",
        stateChanges: [{ variableId: "hp", operation: "set", value: 100 }],
      });
      expect(parser.isStructuredResponse(json)).toBe(true);
    });

    it("returns false for plain text with directives", () => {
      expect(parser.isStructuredResponse("The hero enters. [hp: set 100]")).toBe(false);
    });

    it("returns false for JSON without narrative field", () => {
      const json = JSON.stringify({ foo: "bar" });
      expect(parser.isStructuredResponse(json)).toBe(false);
    });

    it("returns false for malformed JSON", () => {
      expect(parser.isStructuredResponse('{ "narrative": ')).toBe(false);
    });
  });

  describe("parse", () => {
    it("extracts narrative as cleanText", () => {
      const json = JSON.stringify({
        narrative: "The hero enters the room.",
        stateChanges: [],
      });
      const result = parser.parse(json);
      expect(result.cleanText).toBe("The hero enters the room.");
    });

    it("converts stateChanges to effects", () => {
      const json = JSON.stringify({
        narrative: "Scene text",
        stateChanges: [
          { variableId: "hp", operation: "set", value: 100 },
          { variableId: "gold", operation: "add", value: 50 },
        ],
      });
      const result = parser.parse(json);
      expect(result.effects).toEqual([
        { variableId: "hp", operation: "set", value: 100 },
        { variableId: "gold", operation: "add", value: 50 },
      ]);
    });

    it("handles segments variable (JSON array value)", () => {
      const segments = [
        { speaker: "陽菜", text: "Hello!", variant: "default", color: "#f472b6" },
        { speaker: "", text: "Narration.", variant: "narration" },
      ];
      const json = JSON.stringify({
        narrative: "Scene text",
        stateChanges: [
          { variableId: "segments", operation: "set", value: segments },
        ],
      });
      const result = parser.parse(json);
      expect(result.effects).toEqual([
        { variableId: "segments", operation: "set", value: segments },
      ]);
    });

    it("handles choices variable", () => {
      const json = JSON.stringify({
        narrative: "Scene",
        stateChanges: [
          { variableId: "choices", operation: "set", value: ["Option A", "Option B"] },
        ],
      });
      const result = parser.parse(json);
      expect(result.effects[0]!.value).toEqual(["Option A", "Option B"]);
    });

    it("handles missing stateChanges gracefully", () => {
      const json = JSON.stringify({ narrative: "Just text" });
      const result = parser.parse(json);
      expect(result.cleanText).toBe("Just text");
      expect(result.effects).toEqual([]);
    });

    it("extracts audio effects from stateChanges", () => {
      const json = JSON.stringify({
        narrative: "Scene",
        stateChanges: [],
        audioEffects: [{ trackId: "bgm1", action: "play" }],
      });
      const result = parser.parse(json);
      expect(result.audioEffects).toEqual([{ trackId: "bgm1", action: "play" }]);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/engine && npx vitest run src/__tests__/structured-response-parser.test.ts`
Expected: FAIL — module not found

**Step 3: Implement StructuredResponseParser**

```typescript
// packages/engine/src/parser/structured-response-parser.ts
import type { Effect, AudioEffect } from "../types/index.js";
import type { ParseResult } from "./response-parser.js";

interface StructuredStateChange {
  variableId: string;
  operation: string;
  value: unknown;
}

interface StructuredResponse {
  narrative: string;
  stateChanges?: StructuredStateChange[];
  audioEffects?: AudioEffect[];
}

/**
 * Parses structured JSON responses from LLMs.
 * Format: { narrative: string, stateChanges: [...], audioEffects?: [...] }
 * Falls back gracefully — call isStructuredResponse() first to check.
 */
export class StructuredResponseParser {
  /**
   * Check if the response looks like a structured JSON response.
   * Must start with '{', parse as valid JSON, and contain a 'narrative' field.
   */
  isStructuredResponse(text: string): boolean {
    const trimmed = text.trimStart();
    if (!trimmed.startsWith("{")) return false;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "object" && parsed !== null && "narrative" in parsed;
    } catch {
      return false;
    }
  }

  /**
   * Parse a structured JSON response into ParseResult.
   * Assumes isStructuredResponse() returned true.
   */
  parse(text: string): ParseResult {
    const parsed: StructuredResponse = JSON.parse(text.trimStart());

    const cleanText = parsed.narrative ?? "";
    const effects: Effect[] = [];
    const audioEffects: AudioEffect[] = parsed.audioEffects ?? [];

    if (Array.isArray(parsed.stateChanges)) {
      for (const change of parsed.stateChanges) {
        if (change.variableId && change.operation) {
          effects.push({
            variableId: change.variableId,
            operation: change.operation as Effect["operation"],
            value: change.value as Effect["value"],
          });
        }
      }
    }

    return { cleanText, effects, audioEffects };
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/engine && npx vitest run src/__tests__/structured-response-parser.test.ts`
Expected: PASS

**Step 5: Export from engine index**

Add to `packages/engine/src/index.ts` after the ResponseParser exports (line 157):
```typescript
export { StructuredResponseParser } from "./parser/structured-response-parser.js";
```

**Step 6: Commit**

```bash
git add packages/engine/src/parser/structured-response-parser.ts packages/engine/src/__tests__/structured-response-parser.test.ts packages/engine/src/index.ts
git commit -m "feat(engine): add StructuredResponseParser for JSON LLM responses"
```

---

### Task 2: IncrementalSegmentExtractor (Engine)

**Files:**
- Create: `packages/engine/src/parser/incremental-segment-extractor.ts`
- Create: `packages/engine/src/__tests__/incremental-segment-extractor.test.ts`
- Modify: `packages/engine/src/index.ts`

**Step 1: Write tests**

```typescript
// packages/engine/src/__tests__/incremental-segment-extractor.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { IncrementalSegmentExtractor } from "../parser/incremental-segment-extractor.js";

describe("IncrementalSegmentExtractor", () => {
  let extractor: IncrementalSegmentExtractor;

  beforeEach(() => {
    extractor = new IncrementalSegmentExtractor();
  });

  it("extracts nothing from empty content", () => {
    const result = extractor.extract("");
    expect(result.newSegments).toEqual([]);
    expect(result.bg).toBeNull();
  });

  it("extracts a single completed segment", () => {
    const content = `{"narrative":"test","stateChanges":[{"variableId":"segments","operation":"set","value":[{"speaker":"陽菜","text":"Hello!","variant":"default","color":"#f472b6"}`;
    const result = extractor.extract(content);
    expect(result.newSegments).toHaveLength(1);
    expect(result.newSegments[0]!.speaker).toBe("陽菜");
    expect(result.newSegments[0]!.text).toBe("Hello!");
  });

  it("does not re-extract already seen segments", () => {
    const content1 = `{"narrative":"test","stateChanges":[{"variableId":"segments","operation":"set","value":[{"speaker":"A","text":"First","variant":"default"}`;
    extractor.extract(content1);

    const content2 = content1 + `,{"speaker":"B","text":"Second","variant":"default"}`;
    const result = extractor.extract(content2);
    expect(result.newSegments).toHaveLength(1);
    expect(result.newSegments[0]!.speaker).toBe("B");
  });

  it("extracts currentBg from stateChanges", () => {
    const content = `{"narrative":"test","stateChanges":[{"variableId":"currentBg","operation":"set","value":"classroom"}`;
    const result = extractor.extract(content);
    expect(result.bg).toBe("classroom");
  });

  it("extracts bg from segment bg field", () => {
    const content = `{"narrative":"test","stateChanges":[{"variableId":"segments","operation":"set","value":[{"bg":"rooftop","speaker":"","text":"On the roof","variant":"narration"}`;
    const result = extractor.extract(content);
    expect(result.newSegments).toHaveLength(1);
    expect(result.bg).toBe("rooftop");
  });

  it("handles multiple segments in one extract call", () => {
    const content = `{"narrative":"test","stateChanges":[{"variableId":"segments","operation":"set","value":[{"speaker":"A","text":"One","variant":"default"},{"speaker":"B","text":"Two","variant":"default"},{"speaker":"C","text":"Three","variant":"default"}`;
    const result = extractor.extract(content);
    expect(result.newSegments).toHaveLength(3);
  });

  it("ignores incomplete segment objects", () => {
    const content = `{"narrative":"test","stateChanges":[{"variableId":"segments","operation":"set","value":[{"speaker":"A","text":"Complete","variant":"default"},{"speaker":"B","text":"Incomp`;
    const result = extractor.extract(content);
    expect(result.newSegments).toHaveLength(1);
    expect(result.newSegments[0]!.text).toBe("Complete");
  });

  it("works with non-JSON responses (returns empty)", () => {
    const content = "The hero enters. [hp: -10]";
    const result = extractor.extract(content);
    expect(result.newSegments).toEqual([]);
    expect(result.bg).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/engine && npx vitest run src/__tests__/incremental-segment-extractor.test.ts`
Expected: FAIL

**Step 3: Implement IncrementalSegmentExtractor**

```typescript
// packages/engine/src/parser/incremental-segment-extractor.ts

export interface ExtractedSegment {
  speaker?: string;
  text: string;
  variant?: string;
  color?: string;
  emotion?: string;
  bg?: string;
  [key: string]: unknown;
}

export interface ExtractionResult {
  /** Newly found segments since last call */
  newSegments: ExtractedSegment[];
  /** Latest background change detected, or null */
  bg: string | null;
}

/**
 * Incrementally extracts completed segment objects from a growing
 * structured JSON response string. Tracks how many segments have
 * been previously extracted to avoid re-emitting.
 */
export class IncrementalSegmentExtractor {
  private extractedCount = 0;
  private lastBg: string | null = null;

  /**
   * Scan the current accumulated content and return any new segments
   * and background changes found since the last call.
   */
  extract(content: string): ExtractionResult {
    const newSegments: ExtractedSegment[] = [];
    let bg: string | null = null;

    // Only process JSON-looking responses
    if (!content.trimStart().startsWith("{")) {
      return { newSegments, bg };
    }

    // Extract currentBg from stateChanges
    const bgMatch = content.match(/"variableId"\s*:\s*"currentBg"[^}]*"value"\s*:\s*"([^"]+)"/);
    if (bgMatch && bgMatch[1] !== this.lastBg) {
      bg = bgMatch[1]!;
      this.lastBg = bg;
    }

    // Find the segments array value
    const segmentsStart = this.findSegmentsArrayStart(content);
    if (segmentsStart === -1) return { newSegments, bg };

    // Extract complete {...} objects from the array
    const allSegments = this.extractCompleteObjects(content, segmentsStart);

    // Only return segments we haven't seen before
    for (let i = this.extractedCount; i < allSegments.length; i++) {
      const seg = allSegments[i]!;
      newSegments.push(seg);
      // Check for bg field on segment
      if (seg.bg && seg.bg !== this.lastBg) {
        bg = seg.bg;
        this.lastBg = bg;
      }
    }
    this.extractedCount = allSegments.length;

    return { newSegments, bg };
  }

  /** Reset state for a new response */
  reset(): void {
    this.extractedCount = 0;
    this.lastBg = null;
  }

  private findSegmentsArrayStart(content: string): number {
    // Look for "variableId":"segments" ... "value":[ pattern
    const pattern = /"variableId"\s*:\s*"segments"[^[]*"value"\s*:\s*\[/;
    const match = content.match(pattern);
    if (!match || match.index === undefined) return -1;
    return match.index + match[0].length;
  }

  private extractCompleteObjects(content: string, startPos: number): ExtractedSegment[] {
    const segments: ExtractedSegment[] = [];
    let i = startPos;

    while (i < content.length) {
      // Skip whitespace and commas
      while (i < content.length && (content[i] === " " || content[i] === "\n" || content[i] === "\r" || content[i] === "\t" || content[i] === ",")) {
        i++;
      }

      if (i >= content.length || content[i] !== "{") break;

      // Find matching closing brace
      const objStart = i;
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (; i < content.length; i++) {
        const ch = content[i]!;

        if (escaped) {
          escaped = false;
          continue;
        }

        if (ch === "\\") {
          escaped = true;
          continue;
        }

        if (ch === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (ch === "{") depth++;
        if (ch === "}") {
          depth--;
          if (depth === 0) {
            // Found a complete object
            const objStr = content.slice(objStart, i + 1);
            try {
              const parsed = JSON.parse(objStr);
              if (parsed && typeof parsed === "object" && "text" in parsed) {
                segments.push(parsed as ExtractedSegment);
              }
            } catch {
              // Incomplete or malformed — skip
            }
            i++;
            break;
          }
        }
      }

      // If we didn't find a closing brace, the object is incomplete — stop
      if (depth > 0) break;
    }

    return segments;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/engine && npx vitest run src/__tests__/incremental-segment-extractor.test.ts`
Expected: PASS

**Step 5: Export from engine index**

Add to `packages/engine/src/index.ts` after StructuredResponseParser export:
```typescript
export { IncrementalSegmentExtractor } from "./parser/incremental-segment-extractor.js";
export type { ExtractedSegment, ExtractionResult } from "./parser/incremental-segment-extractor.js";
```

**Step 6: Commit**

```bash
git add packages/engine/src/parser/incremental-segment-extractor.ts packages/engine/src/__tests__/incremental-segment-extractor.test.ts packages/engine/src/index.ts
git commit -m "feat(engine): add IncrementalSegmentExtractor for streaming segment detection"
```

---

### Task 3: Server — Emit segment/bg SSE Events + Use StructuredResponseParser

**Files:**
- Modify: `packages/server/src/routes/messages.ts` (lines 526-649)

**Step 1: Add imports at top of messages.ts**

Add after existing engine imports:
```typescript
import { StructuredResponseParser, IncrementalSegmentExtractor } from "@yumina/engine";
```

**Step 2: Modify the streaming loop**

In the `streamSSE` callback (around line 526), add the extractor setup and modify the text/done handling:

```typescript
// Inside streamSSE callback, before the for-await loop:
const structuredParser = new StructuredResponseParser();
const segmentExtractor = new IncrementalSegmentExtractor();

// Inside the text chunk handler (line 541-546), AFTER the existing stream.writeSSE for text:
// Check for new segments
const extraction = segmentExtractor.extract(fullContent);
for (const segment of extraction.newSegments) {
  await stream.writeSSE({
    event: "segment",
    data: JSON.stringify({ segment }),
  });
}
if (extraction.bg) {
  await stream.writeSSE({
    event: "bg",
    data: JSON.stringify({ bg: extraction.bg }),
  });
}

// In the done handler (line 557+), replace the parse line:
// OLD: const parseResult = responseParser.parse(fullContent);
// NEW:
const parseResult = structuredParser.isStructuredResponse(fullContent)
  ? structuredParser.parse(fullContent)
  : responseParser.parse(fullContent);
```

**Step 3: Verify build**

Run: `cd packages/server && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/server/src/routes/messages.ts
git commit -m "feat(server): emit segment/bg SSE events during streaming + structured JSON parsing"
```

---

### Task 4: Client SSE — Handle New Event Types

**Files:**
- Modify: `packages/app/src/lib/sse.ts`

**Step 1: Extend SSECallbacks interface**

```typescript
export interface SSECallbacks {
  onText: (content: string) => void;
  onSegment?: (data: { segment: Record<string, unknown> }) => void;
  onBg?: (data: { bg: string }) => void;
  onDone: (data: Record<string, unknown>) => void;
  onError: (error: string) => void;
}
```

**Step 2: Add cases to the switch statement (around line 69)**

```typescript
case "segment":
  options.callbacks.onSegment?.(parsed);
  break;
case "bg":
  options.callbacks.onBg?.(parsed);
  break;
```

**Step 3: Commit**

```bash
git add packages/app/src/lib/sse.ts
git commit -m "feat(app): handle segment/bg SSE events in client"
```

---

### Task 5: Chat Store — Streaming Segments State

**Files:**
- Modify: `packages/app/src/stores/chat.ts`

**Step 1: Add streaming segment state fields**

In the store state type and initial state, add:
```typescript
streamingSegments: Record<string, unknown>[];
streamingBg: string | null;
```

Initialize both in the store creation (streamingSegments: [], streamingBg: null).

**Step 2: Add onSegment/onBg callbacks in sendMessage**

In the `connectSSE` callbacks object (around line 301):

```typescript
onSegment: (data) => {
  set((s) => ({
    streamingSegments: [...s.streamingSegments, data.segment],
  }));
},
onBg: (data) => {
  set({ streamingBg: data.bg });
},
```

**Step 3: Clear streaming state in onDone**

In the `set()` call inside onDone (around line 344), add:
```typescript
streamingSegments: [],
streamingBg: null,
```

**Step 4: Clear streaming state in onError**

In the `set()` call inside onError (around line 389), add:
```typescript
streamingSegments: [],
streamingBg: null,
```

**Step 5: Commit**

```bash
git add packages/app/src/stores/chat.ts
git commit -m "feat(app): add streamingSegments/streamingBg state to chat store"
```

---

### Task 6: MessageList + MessageBubble — Pass Streaming Data to Components

**Files:**
- Modify: `packages/app/src/features/chat/message-list.tsx`
- Modify: `packages/app/src/features/chat/message-bubble.tsx`
- Modify: `packages/app/src/features/studio/lib/custom-component-renderer.tsx`

**Step 1: MessageList — read streaming state and merge into variables for streaming bubble**

In `message-list.tsx`, update the store destructure (line 11):
```typescript
const { messages, isStreaming, streamingContent, session, error, clearError, gameState, streamingSegments, streamingBg } = useChatStore();
```

Update the streaming MessageBubble (around line 209-225) to pass merged variables:
```typescript
{isStreaming && streamingContent && (
  <MessageBubble
    message={{
      id: "__streaming__",
      sessionId: "",
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    }}
    isStreaming
    streamingContent={streamingContent}
    messageRenderer={messageRenderer}
    variables={
      streamingSegments.length > 0
        ? {
            ...gameState,
            segments: streamingSegments,
            ...(streamingBg ? { currentBg: streamingBg } : {}),
          }
        : gameState
    }
    yuminaAPI={yuminaAPI}
    messageIndex={activeMessages.length}
  />
)}
```

**Step 2: MessageBubble — pass isStreaming to CustomComponentRenderer via extraProps**

In `message-bubble.tsx`, in the `extraProps` passed to `CustomComponentRenderer` (line 99):
```typescript
extraProps={{ content: displayContent, role: message.role, messageIndex, renderMarkdown, isStreaming: !!isStreaming }}
```

**Step 3: Commit**

```bash
git add packages/app/src/features/chat/message-list.tsx packages/app/src/features/chat/message-bubble.tsx
git commit -m "feat(app): pass streaming segments to custom components during streaming"
```

---

### Task 7: Build + Typecheck + Manual Test

**Step 1: Build all packages**

Run: `pnpm build`
Expected: Success

**Step 2: Typecheck all packages**

Run: `pnpm typecheck`
Expected: Success

**Step 3: Run engine tests**

Run: `cd packages/engine && npx vitest run`
Expected: All tests pass (including existing response-parser tests — backward compat)

**Step 4: Manual test with existing cards**

Start dev server (`pnpm dev`), load a regex-based card (e.g., 八号出口 or douluo), send a message. Verify state changes still work as before.

**Step 5: Manual test with 桜色の季節**

Load the 桜色の季節 card, send a message. Verify:
- Segments appear incrementally (can click through while generating)
- Background transitions work mid-scene
- Final state is correct after generation completes
- Choices appear after all segments

**Step 6: Commit any fixes**

```bash
git commit -m "fix: address issues found during manual testing"
```

---

### Task 8 (Optional): Update VN Component TSX for Streaming Awareness

This task is only needed if the VN component in 桜色の季節 doesn't gracefully handle progressive segment updates. The component already reads `variables.segments` and tracks its own `segmentIndex` — adding segments to the end should work. But if the component resets or behaves oddly, update the card's TSX to:

1. Accept `isStreaming` from `extraProps`
2. When `segmentIndex >= segments.length && isStreaming`, show a typing indicator
3. When `segmentIndex >= segments.length && !isStreaming`, show choices

This is card-level code, not engine/app code.
