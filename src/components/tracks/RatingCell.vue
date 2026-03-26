<script setup lang="ts">
import { ref } from 'vue'
import { useTracksStore } from '../../stores/tracks'

const props = defineProps<{ value: number, trackId: number }>()
const tracksStore = useTracksStore()
const hovered = ref(0)

async function setRating(star: number) {
  // Only clear (set to 0) when clicking 1★ that is already the current rating
  const newRating = (star === 1 && props.value === 1) ? 0 : star
  if (newRating === props.value) return
  await tracksStore.updateRating(props.trackId, newRating)
}
</script>

<template>
  <div class="rating" role="radiogroup" aria-label="Rating">
    <span
      v-for="i in 5"
      :key="i"
      class="star"
      role="radio"
      :aria-checked="(hovered === 0 ? i <= value : i <= hovered).toString()"
      :aria-label="`${i} star${i > 1 ? 's' : ''}`"
      tabindex="0"
      :class="{
        filled: hovered === 0 && i <= value,
        preview: hovered > 0 && i <= hovered,
      }"
      @mouseenter="hovered = i"
      @mouseleave="hovered = 0"
      @click.stop="setRating(i)"
      @keydown.enter.stop="setRating(i)"
      @keydown.space.prevent.stop="setRating(i)"
    >★</span>
  </div>
</template>

<style scoped>
.rating {
  display: flex;
  gap: 1px;
  cursor: pointer;
}
.star {
  font-size: 11px;
  color: var(--rating-empty, #444);
  line-height: 1;
}
.star.filled {
  color: var(--rating-star, #ff6600);
}
.star.preview {
  color: color-mix(in srgb, var(--accent) 60%, transparent);
}
</style>
