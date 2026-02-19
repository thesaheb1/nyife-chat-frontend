import { toast } from "sonner"

// Success
export const showSuccessToast = (message: string = "Success!") => {
  return toast.success(message)
}

// Error
export const showErrorToast = (
  message: string = "Something went wrong."
) => {
  return toast.error(message)
}

// Loading
export const showLoadingToast = (
  message: string = "Loading..."
) => {
  return toast.loading(message)
}

// Dismiss
export const dismissToast = (id?: string | number) => {
  toast.dismiss(id)
}
