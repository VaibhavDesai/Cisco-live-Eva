import { createPortal } from 'react-dom';
import { Button, Dialog } from '../momentum';

export interface DeleteScenarioConfirmDialogProps {
  open: boolean;
  scenarioName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteScenarioConfirmDialog({
  open,
  scenarioName,
  onOpenChange,
  onConfirm,
}: DeleteScenarioConfirmDialogProps) {
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

  const title = scenarioName.trim() ? `Delete ${scenarioName}?` : 'Delete test scenario?';

  return createPortal(
    <Dialog
      className="delete-scenario-confirm-dialog"
      visible={open}
      size="medium"
      headerText={title}
      descriptionText="This action cannot be undone. Are you sure you wish to delete?"
      closeButtonAriaLabel="Close dialog"
      onClose={handleClose}
    >
      <Button
        slot="footer-button-secondary"
        type="button"
        color="default"
        variant="secondary"
        size={32}
        onClick={handleClose}
      >
        Keep scenario
      </Button>
      <Button
        slot="footer-button-primary"
        type="button"
        color="negative"
        variant="primary"
        size={32}
        onClick={handleConfirm}
      >
        Delete scenario
      </Button>
    </Dialog>,
    portalTarget,
  );
}
