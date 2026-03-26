# Streaming Segments Design

## Problem

Cards using structured JSON output (like 桜色の季節) return a JSON blob:
```json
{
  "narrative": "...",
  "stateChanges": [
    { "variableId": "segments", "operation": "set", "value": [...] },
    { "variableId": "currentBg", "operation": "set", "value": "classroom" },
    { "variableId": "choices", "operation": "set", "value": [...] }
  ]
}
```

Two problems:
1. **Server can't parse this** — `ResponseParser` only handles regex `[var: op value]` directives, not JSON structure. State changes are silently lost.
2. **No incremental streaming** — Players must wait for the full response before the VN component can show any segments.

## Solution: Two-Part Fix

### Part 1: StructuredResponseParser (Engine)

Add JSON response parsing alongside existing regex parsing.

**Detection**: If `fullContent.trimStart()` starts with `{`, try JSON parse. On failure, fall back to regex.

**Parsing**: Extract `narrative` as cleanText, convert `stateChanges[]` to `Effect[]`.

**Backward compatibility**: All 12 existing regex-based cards are unaffected — detection only triggers on JSON responses.

### Part 2: Incremental Segment Streaming (Server + Client)

#### Server: IncrementalSegmentExtractor

A lightweight class that scans growing `fullContent` for completed segments:
- Track number of already-extracted segments
- Find complete `{...}` objects within the segments array using brace-depth counting
- Detect `currentBg` changes via simple regex on partial JSON
- Return newly found segments and bg changes

#### Server: New SSE Events

In the streaming loop, after each `text` chunk:
```
event: segment
data: { "segment": { "speaker": "陽菜", "text": "...", ... }, "index": 0 }

event: bg
data: { "bg": "classroom" }
```

#### Client: SSE + Store

- `SSECallbacks`: add optional `onSegment`, `onBg`
- Chat store: new fields `streamingSegments: Segment[]`, `streamingBg: string | null`
- On `onSegment`: push to `streamingSegments`
- On `onBg`: update `streamingBg`
- On `onDone`: clear streaming fields, apply final state snapshot

#### Client: Component Integration

During streaming, merge streaming state into variables passed to custom components:
```typescript
const effectiveVars = isStreaming && streamingSegments.length > 0
  ? { ...variables, segments: streamingSegments, currentBg: streamingBg ?? variables.currentBg }
  : variables;
```

Pass `isStreaming` as extraProp so VN components can show a waiting indicator.

#### VN Component (Card TSX)

When `segmentIndex >= segments.length && isStreaming`:
- Show typing/waiting animation instead of choices
- When new segment arrives, allow click to advance
- When streaming ends, show choices normally

## Data Flow

```
LLM chunk → Server accumulates fullContent
  → IncrementalSegmentExtractor.extract(fullContent)
    → New segment found? → SSE event: segment
    → New bg found? → SSE event: bg
  → SSE event: text (unchanged)

LLM done → StructuredResponseParser.parse(fullContent)
  → Extract effects → Apply state → Rules → Persist
  → SSE event: done (unchanged)

Client:
  onSegment → push to streamingSegments → VN re-renders
  onBg → update streamingBg → VN background transitions
  onDone → final state snapshot replaces everything
```

## Files to Modify

| Layer | File | Change |
|-------|------|--------|
| Engine | `parser/structured-response-parser.ts` | NEW — JSON response parser |
| Engine | `parser/incremental-segment-extractor.ts` | NEW — streaming segment detection |
| Engine | `index.ts` | Export new classes |
| Server | `routes/messages.ts` | Use new parsers, emit segment/bg SSE events |
| App | `lib/sse.ts` | Handle segment/bg event types |
| App | `stores/chat.ts` | streamingSegments/streamingBg state + callbacks |
| App | `features/chat/message-list.tsx` | Pass streaming vars to components |
| App | `features/studio/lib/custom-component-renderer.tsx` | Pass isStreaming prop |
| Card | VN component TSX | Handle progressive segments + waiting state |

## Backward Compatibility

- Regex cards: `ResponseParser` is tried first for non-JSON. Zero change in behavior.
- JSON detection is conservative: only activates when response starts with `{` AND parses as valid JSON with `narrative`/`stateChanges` fields.
- New SSE events (`segment`, `bg`) are ignored by clients that don't register callbacks.
- `streamingSegments` only populated when server emits segment events.
