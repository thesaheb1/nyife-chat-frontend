import { useDispatch, useSelector } from "react-redux";
import { closeConfirmation } from "../../redux/slices/confirmationSlice";
import ConfirmationDialog from "./ConfirmationDialog";
import { useState } from "react";

const GlobalConfirmationDialog = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { open, actionType, callbackFunction, customText } = useSelector(
    (state) => state.confirmation
  );

  const handleClose = () => dispatch(closeConfirmation());

  const handleConfirm = async () => {
    if (callbackFunction) {
      setLoading(true);
      await callbackFunction();
      setLoading(false);
    }
    dispatch(closeConfirmation());
  };

  const getDialogConfig = (actionType) => {
    switch (actionType) {
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

  // merge custom overrides
  const dialogProps = { ...getDialogConfig(actionType), ...(customText || {}) };

  // ✅ Don't render when not open → prevents default text flash
  if (!open) return null;

  return (
    <ConfirmationDialog
      open={open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      loading={loading}
      {...dialogProps}
    />
  );
};

export default GlobalConfirmationDialog;
