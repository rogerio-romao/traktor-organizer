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
      :style="{ background: getTagColor(tag).bg, color: getTagColor(tag).text }"
    >{{ tag }}</span>
  </div>
</template>

<style scoped>
.tag-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}
.tag-pill {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  white-space: nowrap;
  line-height: 16px;
}
</style>
