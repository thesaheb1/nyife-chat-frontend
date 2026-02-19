"use client"

import { Toaster } from "sonner"

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
                style: {
                    borderRadius: "8px",
                    fontSize: "14px",
                },
            }}
        />
    )
}
