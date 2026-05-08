import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Dialog, Textarea } from '../momentum';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';

export interface RunEvaluationDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerID: string;
  /** Called with trimmed description after validation passes. */
  onConfirm: (description: string) => void;
}

export function RunEvaluationDescriptionDialog({
  open,
  onOpenChange,
  triggerID,
  onConfirm,
}: RunEvaluationDescriptionDialogProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescription('');
    setError(null);
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const portalTarget =
    typeof document !== 'undefined' ? document.querySelector('mdc-iconprovider') ?? document.body : null;

  if (typeof document === 'undefined' || !portalTarget) {
    return null;
  }

  const handleRun = () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Enter a description so others know what this evaluation covers.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
    handleClose();
  };

  return createPortal(
    <Dialog
      className="run-evaluation-description-dialog"
      visible={open}
      size="medium"
      headerText="Evaluation description"
      descriptionText="Provide a description for the evaluation to be run"
      closeButtonAriaLabel="Close evaluation description"
      triggerID={triggerID}
      onClose={handleClose}
    >
      <div slot="dialog-body" className="run-evaluation-description-dialog-body flex min-w-0 flex-col gap-4">
        {error ? (
          <p role="alert" className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textError}`}>
            {error}
          </p>
        ) : null}
        <Textarea
          label="Description"
          placeholder="Enter a description for the evaluation..."
          value={description}
          rows={6}
          onInput={(e: Event) => {
            setError(null);
            setDescription((e.target as HTMLTextAreaElement).value ?? '');
          }}
        />
      </div>

      <Button slot="footer-button-secondary" color="default" variant="secondary" size={32} onClick={handleClose}>
        Cancel
      </Button>
      <Button
        slot="footer-button-primary"
        color="default"
        variant="primary"
        size={32}
        prefixIcon="sparkle-bold"
        onClick={handleRun}
      >
        Run evaluation
      </Button>
    </Dialog>,
    portalTarget,
  );
}
