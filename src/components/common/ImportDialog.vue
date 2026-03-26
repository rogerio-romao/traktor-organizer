<script setup lang="ts">
import { ref } from 'vue';

import { useImport } from '@/composables/useImport';

import type { ImportStats } from '@/composables/useImport';

const emit = defineEmits<{
    imported: [stats: ImportStats];
}>();

const { isImporting, progress, progressLabel, error, pickAndImport } = useImport();
const stats = ref<ImportStats | null>(null);
const isOpen = ref(false);

function open(): void {
    isOpen.value = true;
    stats.value = null;
    error.value = null;
}

function close(): void {
    if (isImporting.value) return;
    isOpen.value = false;
}

async function handleImport(): Promise<void> {
    stats.value = null;
    const result = await pickAndImport();
    if (result) {
        stats.value = result;
        emit('imported', result);
    } else {
        // User cancelled the file picker — close the dialog
        close();
    }
}

defineExpose({ open });
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen" class="dialog-backdrop" @click.self="close">
            <div class="dialog">
                <div class="dialog-header">
                    <h2>Import Traktor Collection</h2>
                    <button class="close-btn" :disabled="isImporting" @click="close">✕</button>
                </div>

                <div class="dialog-body">
                    <!-- Idle: prompt to pick file -->
                    <template v-if="!isImporting && !stats">
                        <p class="hint">
                            Select your <code>collection.nml</code> file from your Traktor folder.
                            The app will default to your last used location, or
                            <code>Documents/Native Instruments</code> if this is your first import.
                        </p>
                        <p v-if="error" class="error-msg">{{ error }}</p>
                    </template>

                    <!-- In progress -->
                    <template v-else-if="isImporting">
                        <p class="progress-label">{{ progressLabel }}</p>
                        <div class="progress-bar-track">
                            <div class="progress-bar-fill" :style="{ width: `${progress}%` }" />
                        </div>
                        <p class="progress-pct">{{ progress }}%</p>
                    </template>

                    <!-- Done -->
                    <template v-else-if="stats">
                        <div class="stats">
                            <div class="stat-row">
                                <span class="stat-label">Total tracks in file</span>
                                <span class="stat-value">{{ stats.total.toLocaleString() }}</span>
                            </div>
                            <div class="stat-row new">
                                <span class="stat-label">New tracks added</span>
                                <span class="stat-value">{{
                                    stats.inserted.toLocaleString()
                                }}</span>
                            </div>
                            <div class="stat-row updated">
                                <span class="stat-label">Existing tracks updated</span>
                                <span class="stat-value">{{ stats.updated.toLocaleString() }}</span>
                            </div>
                        </div>
                        <p
                            v-if="stats.inserted === 0 && stats.updated === 0 && !error"
                            class="all-up-to-date"
                        >
                            Collection is already up to date.
                        </p>
                        <p v-if="error" class="error-msg">{{ error }}</p>
                    </template>
                </div>

                <div class="dialog-footer">
                    <template v-if="!isImporting && !stats">
                        <button class="btn-secondary" @click="close">Cancel</button>
                        <button class="btn-primary" @click="handleImport">Choose File…</button>
                    </template>
                    <template v-else-if="stats">
                        <button class="btn-primary" @click="close">Done</button>
                    </template>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.dialog {
    background: var(--bg-secondary, #242424);
    border: 1px solid var(--border, #333);
    border-radius: 8px;
    width: 440px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    gap: 0;
}

.dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--border, #333);
}

.dialog-header h2 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary, #e0e0e0);
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #999);
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    line-height: 1;
}
.close-btn:hover {
    color: var(--text-primary, #e0e0e0);
}
.close-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.dialog-body {
    padding: 20px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.hint {
    color: var(--text-secondary, #999);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
}

.hint code {
    color: var(--accent, #ff6600);
    background: rgba(255, 102, 0, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 12px;
}

.error-msg {
    color: #e05555;
    font-size: 13px;
    margin: 0;
}

.progress-label {
    color: var(--text-primary, #e0e0e0);
    font-size: 13px;
    margin: 0;
}

.progress-bar-track {
    height: 6px;
    background: var(--bg-tertiary, #2e2e2e);
    border-radius: 3px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background: var(--accent, #ff6600);
    border-radius: 3px;
    transition: width 0.2s ease;
}

.progress-pct {
    color: var(--text-secondary, #999);
    font-size: 12px;
    text-align: right;
    margin: 0;
}

.stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 6px 10px;
    border-radius: 4px;
    background: var(--bg-tertiary, #2e2e2e);
}

.stat-label {
    color: var(--text-secondary, #999);
}
.stat-value {
    color: var(--text-primary, #e0e0e0);
    font-weight: 600;
}
.stat-row.new .stat-value {
    color: #5cb85c;
}
.stat-row.updated .stat-value {
    color: var(--accent, #ff6600);
}

.all-up-to-date {
    font-size: 12px;
    color: #5cb85c;
    margin: 0;
    text-align: center;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid var(--border, #333);
}

.btn-primary,
.btn-secondary {
    padding: 7px 16px;
    border-radius: 5px;
    font-size: 13px;
    cursor: pointer;
    border: none;
}

.btn-primary {
    background: var(--accent, #ff6600);
    color: #fff;
}
.btn-primary:hover {
    background: var(--accent-dim, #cc5200);
}

.btn-secondary {
    background: var(--bg-tertiary, #2e2e2e);
    color: var(--text-secondary, #999);
    border: 1px solid var(--border, #333);
}
.btn-secondary:hover {
    color: var(--text-primary, #e0e0e0);
}
</style>
