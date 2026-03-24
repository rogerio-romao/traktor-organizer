<script setup lang="ts">
import { getTagColor } from '../../utils/tag-colors'

defineProps<{ tags: string[] }>()
</script>

<template>
  <div class="tag-cell">
    <span
      v-for="tag in tags"
      :key="tag"
      class="tag-pill"
      :style="{ background: getTagColor(tag).bg, borderColor: getTagColor(tag).border }"
    >{{ tag }}</span>
  </div>
</template>

<style scoped>
.tag-cell {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
  padding: 2px 0;
  overflow: hidden;
}
.tag-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 16px;
  color: var(--text-primary, #e0e0e0);
}
</style>
