import { toast } from "sonner"

export const showProgressToast = (
    message: string,
    progress: number,
    id?: string
) => {
    const safeProgress = Math.min(100, Math.max(0, progress))

    return toast.custom(
        () => (
            <div className="w-75 space-y-2">
                <div className="flex justify-between text-sm">
                    <span>{message}</span>
                    <span>{safeProgress}%</span>
                </div>

                <div className="h-2 w-full bg-muted rounded overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${safeProgress}%` }}
                    />
                </div>
            </div>
        ),
        {
            id,
            duration: Infinity,
        }
    )
}
