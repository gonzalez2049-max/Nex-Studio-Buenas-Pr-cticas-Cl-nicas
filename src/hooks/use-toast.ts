// Adaptado del hook de toast de shadcn/ui.
import * as React from 'react'
import type { ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 4
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type State = { toasts: ToasterToast[] }

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

const timeouts = new Map<string, ReturnType<typeof setTimeout>>()

type Action =
  | { type: 'ADD'; toast: ToasterToast }
  | { type: 'UPDATE'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS'; toastId?: string }
  | { type: 'REMOVE'; toastId?: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case 'UPDATE':
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }
    case 'DISMISS':
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? { ...t, open: false }
            : t,
        ),
      }
    case 'REMOVE':
      if (action.toastId === undefined) return { toasts: [] }
      return { toasts: state.toasts.filter((t) => t.id !== action.toastId) }
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((l) => l(memoryState))
}

function scheduleRemoval(id: string) {
  if (timeouts.has(id)) return
  const timeout = setTimeout(() => {
    timeouts.delete(id)
    dispatch({ type: 'REMOVE', toastId: id })
  }, TOAST_REMOVE_DELAY)
  timeouts.set(id, timeout)
}

type ToastInput = Omit<ToasterToast, 'id'>

export function toast(props: ToastInput) {
  const id = genId()
  const update = (next: Partial<ToasterToast>) =>
    dispatch({ type: 'UPDATE', toast: { ...next, id } })
  const dismiss = () => dispatch({ type: 'DISMISS', toastId: id })

  dispatch({
    type: 'ADD',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
          dismiss()
          scheduleRemoval(id)
        }
      },
    },
  })

  return { id, dismiss, update }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS', toastId }),
  }
}
