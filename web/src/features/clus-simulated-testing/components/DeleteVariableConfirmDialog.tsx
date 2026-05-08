import { createPortal } from 'react-dom';
import { Button, Dialog } from '../momentum';

export interface DeleteVariableConfirmDialogProps {
  open: boolean;
  variableName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteVariableConfirmDialog({
  open,
  variableName,
  onOpenChange,
  onConfirm,
}: DeleteVariableConfirmDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const portalTarget =
    typeof document !== 'undefined' ? document.querySelector('mdc-iconprovider') ?? document.body : null;

  if (typeof document === 'undefined' || !portalTarget) {
    return null;
  }

  const title = variableName.trim() ? `Delete ${variableName}?` : 'Delete variable?';

  return createPortal(
    <Dialog
      className="delete-variable-confirm-dialog"
      visible={open}
      size="medium"
      headerText={title}
      descriptionText="This action cannot be undone. Are you sure you wish to delete?"
      closeButtonAriaLabel="Close dialog"
      onClose={handleClose}
    >
      <Button slot="footer-button-secondary" color="default" variant="secondary" size={32} onClick={handleClose}>
        Keep variable
      </Button>
      <Button slot="footer-button-primary" color="negative" variant="primary" size={32} onClick={handleConfirm}>
        Delete variable
      </Button>
    </Dialog>,
    portalTarget,
  );
}
