import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
let resolveCallback: ((confirmed: boolean) => void) | null = null

export function useConfirm() {
  function confirm(msg: string): Promise<boolean> {
    message.value = msg
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

  return { visible, message, confirm, respond }
}
