import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmTone = "primary" | "error" | "success";

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  confirmColor?: ConfirmTone;
}

const toneToVariant: Record<ConfirmTone, "default" | "destructive"> = {
  primary: "default",
  error: "destructive",
  success: "default",
};

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "Please confirm your action.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  confirmColor = "primary",
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={toneToVariant[confirmColor]}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
