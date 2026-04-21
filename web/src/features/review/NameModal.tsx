import { useEffect, useRef, useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/shared/Modal';
import Button from '../../components/shared/Button';
import { Input } from '../../components/shared/FormInput';
import { useReview } from './ReviewProvider';

export const NameModal = () => {
  const { nameModalOpen, submitNameModal, cancelNameModal, displayName } = useReview();
  const [value, setValue] = useState(displayName || '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!nameModalOpen) return;
    setValue(displayName || '');
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelNameModal();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [nameModalOpen, displayName, cancelNameModal]);

  if (!nameModalOpen) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    submitNameModal(trimmed);
  };

  return (
    <Modal
      onClose={cancelNameModal}
      size="sm"
      overlayClassName="review-modal-overlay review-modal-overlay--name"
    >
      <form onSubmit={handleSubmit} data-review-ui>
        <ModalHeader
          title="What's your name?"
          description="Shown next to your comments. Stored locally on this device."
          onClose={cancelNameModal}
        />
        <ModalBody>
          <Input
            ref={inputRef}
            label="Display name"
            placeholder="e.g. Alex Kim"
            value={value}
            maxLength={64}
            onChange={(e) => setValue(e.target.value)}
            data-review-ui
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={cancelNameModal} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            Continue
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
