<script setup lang="ts">
import { nextTick, ref } from 'vue';

const { value, onSave } = defineProps<{
    value: string;
    onSave: (value: string) => Promise<void>;
}>();

const editing = ref(false);
const draft = ref('');
const inputEl = ref<HTMLInputElement | null>(null);

async function startEdit(): Promise<void> {
    draft.value = value;
    editing.value = true;
    await nextTick();
    inputEl.value?.select();
}

async function commit(): Promise<void> {
    editing.value = false;
    if (draft.value !== value) {
        await onSave(draft.value.trim());
    }
}

function cancel(): void {
    editing.value = false;
}

function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
        e.preventDefault();
        commit();
    }
    if (e.key === 'Escape') cancel();
}
</script>

<template>
    <div class="editable-cell" @click="!editing && startEdit()">
        <input
            v-if="editing"
            ref="inputEl"
            v-model="draft"
            class="editable-input"
            @blur="commit"
            @keydown="onKeydown"
            @click.stop
        />
        <span v-else class="editable-text">{{ value || '—' }}</span>
    </div>
</template>

<style scoped>
.editable-cell {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: text;
}

.editable-text {
    font-size: 12px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}

.editable-input {
    width: 100%;
    height: 22px;
    padding: 0 4px;
    background: var(--bg-tertiary);
    border: 1px solid var(--accent);
    border-radius: 3px;
    color: var(--text-primary);
    font-size: 12px;
    outline: none;
}
</style>
