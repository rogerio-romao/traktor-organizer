<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';

const { visible, message, confirmLabel, respond } = useConfirm();
</script>

<template>
    <Teleport to="body">
        <div v-if="visible" class="dialog-overlay" @mousedown.self="respond(false)">
            <div class="dialog" role="dialog" :aria-label="message" @keydown.esc="respond(false)">
                <p class="dialog-message">{{ message }}</p>
                <div class="dialog-actions">
                    <button class="btn-cancel" @click="respond(false)">Cancel</button>
                    <button class="btn-confirm" @click="respond(true)">{{ confirmLabel }}</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
}

.dialog {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    width: 320px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
}

.dialog-message {
    margin: 0 0 20px;
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.5;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.btn-cancel {
    height: 30px;
    padding: 0 14px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
}
.btn-cancel:hover {
    color: var(--text-primary);
    border-color: var(--text-secondary);
}

.btn-confirm {
    height: 30px;
    padding: 0 14px;
    background: #c0392b;
    border: none;
    border-radius: 5px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}
.btn-confirm:hover {
    background: #a93226;
}
</style>
