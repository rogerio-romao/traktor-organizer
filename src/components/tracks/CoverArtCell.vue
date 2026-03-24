<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { extractCoverArt } from '../../services/cover-art'

const props = defineProps<{ filePath: string }>()

const dataUrl = ref<string | null>(null)
const loaded = ref(false)

async function load() {
  loaded.value = false
  dataUrl.value = await extractCoverArt(props.filePath)
  loaded.value = true
}

onMounted(load)
watch(() => props.filePath, load)
</script>

<template>
  <div class="cover-art">
    <img v-if="dataUrl" :src="dataUrl" class="cover-img" alt="" />
    <div v-else class="cover-placeholder">♪</div>
  </div>
</template>

<style scoped>
.cover-art {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.cover-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 3px;
  display: block;
}
.cover-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary, #2e2e2e);
  border-radius: 3px;
  color: var(--text-secondary, #666);
  font-size: 16px;
}
</style>
