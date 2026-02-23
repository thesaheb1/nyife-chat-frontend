import ConfirmationDialog from "./ConfirmationDialog";
import { useState } from "react";
import type { ConfirmationDialogProps } from "./ConfirmationDialog";

type ActionType = "delete" | "update" | "add";

interface DialogCustomText {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "error" | "success";
}

interface GlobalConfirmationDialogProps {
  open: boolean;
  actionType?: ActionType;
  callbackFunction?: () => Promise<void> | void;
  customText?: DialogCustomText;
  onClose: () => void;
}

const GlobalConfirmationDialog = ({
  open,
  actionType,
  callbackFunction,
  customText,
  onClose,
}: GlobalConfirmationDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (callbackFunction) {
      setLoading(true);
      await callbackFunction();
      setLoading(false);
    }
    onClose();
  };

  const getDialogConfig = (currentActionType?: ActionType): DialogCustomText => {
    if (!currentActionType) return {};

    switch (currentActionType) {
      case "delete":
        return {
          title: "Delete Item?",
          description: "Are you sure you want to delete this item? This action cannot be undone.",
          confirmText: "Delete",
          confirmColor: "error",
        };
      case "update":
        return {
          title: "Update Item?",
          description: "Do you want to update this item?",
          confirmText: "Update",
          confirmColor: "primary",
        };
      case "add":
        return {
          title: "Add Item?",
          description: "Do you want to add this item?",
          confirmText: "Add",
          confirmColor: "success",
        };
      default:
        return {};
    }
  };

  const dialogProps: ConfirmationDialogProps = {
    open,
    onClose,
    onConfirm: handleConfirm,
    loading,
    ...getDialogConfig(actionType),
    ...(customText || {}),
  };

  if (!open) return null;

  return (
    <ConfirmationDialog
      {...dialogProps}
    />
  );
};

export default GlobalConfirmationDialog;
