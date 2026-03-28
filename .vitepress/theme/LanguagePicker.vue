<script setup>
import { useData } from 'vitepress'

const { lang, page } = useData()
</script>

<template>
  <div v-if="page.isNotFound !== true && page.frontmatter?.layout === 'home'" class="language-picker">
    <div class="language-picker-inner">
      <svg class="globe-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <a
        href="/"
        class="lang-option"
        :class="{ active: lang === 'en-US' }"
        :aria-current="lang === 'en-US' ? 'page' : undefined"
      >English</a>
      <span class="separator">/</span>
      <a
        href="/zh/"
        class="lang-option"
        :class="{ active: lang === 'zh-CN' }"
        :aria-current="lang === 'zh-CN' ? 'page' : undefined"
      >中文</a>
    </div>
  </div>
</template>

<style scoped>
.language-picker {
  display: flex;
  justify-content: center;
  padding-top: 12px;
}

.language-picker-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-size: 14px;
  transition: border-color 0.25s;
}

.language-picker-inner:hover {
  border-color: var(--vp-c-brand-1);
}

.globe-icon {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.separator {
  color: var(--vp-c-text-3);
  user-select: none;
}

.lang-option {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  transition: color 0.25s, background-color 0.25s;
}

.lang-option:hover {
  color: var(--vp-c-brand-1);
}

.lang-option.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font-weight: 600;
}
</style>
