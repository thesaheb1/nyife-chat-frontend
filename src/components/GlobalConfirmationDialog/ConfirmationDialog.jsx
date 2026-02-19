import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
} from "@mui/material";

/**
 * Reusable Confirmation Dialog
 *
 * Props:
 * @param {boolean} open - Whether dialog is open
 * @param {function} onClose - Called when cancel/close
 * @param {function} onConfirm - Called when confirm/ok
 * @param {string} title - Dialog title
 * @param {string} description - Dialog message
 * @param {string} confirmText - Confirm button label (default "Confirm")
 * @param {string} cancelText - Cancel button label (default "Cancel")
 * @param {boolean} loading - Show spinner + disable buttons while processing
 * @param {string} confirmColor - MUI color for confirm button (default "primary")
 */
const ConfirmationDialog = ({
    open,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description = "Please confirm your action.",
    confirmText = "Confirm",
    cancelText = "Cancel", // ✅ added support
    loading = false,
    confirmColor = "primary",
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="confirmation-dialog-title"
            aria-describedby="confirmation-dialog-description"
            fullWidth
            maxWidth="xs"
        >
            {/* Title */}
            <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>

            {/* Description */}
            <DialogContent>
                <DialogContentText id="confirmation-dialog-description">
                    {description}
                </DialogContentText>
            </DialogContent>

            {/* Actions */}
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    color={confirmColor}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={18} />}
                >
                    {loading ? "Processing..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
