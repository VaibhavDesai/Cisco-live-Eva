import Button from '../../components/shared/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../../components/shared/Modal';
import { knowledgeCopy } from './copy';

interface ComingSoonModalProps {
  sourceLabel: string;
  onClose: () => void;
}

/**
 * Placeholder modal used when a user picks a source type that hasn't been
 * implemented yet (Files, Article, Websites). Mirrors the tone of the main
 * SharePoint modal so the flow feels intentional rather than broken.
 */
export default function ComingSoonModal({ sourceLabel, onClose }: ComingSoonModalProps) {
  return (
    <Modal onClose={onClose} size="sm">
      <ModalHeader
        title={`${sourceLabel} — ${knowledgeCopy.detail.comingSoonTitle}`}
        description={knowledgeCopy.detail.comingSoonBody}
        onClose={onClose}
      />
      <ModalBody>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-body-midsize)' }}>
          We&apos;re actively building support for this source type. In the
          meantime, SharePoint is the fastest way to bring external content into
          Webex AI Agent Studio.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
