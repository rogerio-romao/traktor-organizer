<script setup lang="ts">
// Phase 1: read-only display. Phase 2: will add click-to-edit.
defineProps<{ value: number }>()
</script>

<template>
  <div class="rating">
    <span
      v-for="i in 5"
      :key="i"
      class="star"
      :class="{ filled: i <= value }"
    >★</span>
  </div>
</template>

<style scoped>
.rating {
  display: flex;
  gap: 1px;
}
.star {
  font-size: 11px;
  color: var(--rating-empty, #444);
  line-height: 1;
}
.star.filled {
  color: var(--rating-star, #ff6600);
}
</style>
