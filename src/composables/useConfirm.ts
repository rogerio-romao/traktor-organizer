import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const confirmLabel = ref('Confirm')
let resolveCallback: ((confirmed: boolean) => void) | null = null

export function useConfirm() {
  function confirm(msg: string, label = 'Confirm'): Promise<boolean> {
    message.value = msg
    confirmLabel.value = label
    visible.value = true
    return new Promise(resolve => {
      resolveCallback = resolve
    })
  }

  function respond(confirmed: boolean) {
    visible.value = false
    resolveCallback?.(confirmed)
    resolveCallback = null
  }

  return { visible, message, confirmLabel, confirm, respond }
}
