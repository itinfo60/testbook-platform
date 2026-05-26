import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  variant = 'danger',
  loading,
}) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={btnClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </Modal>
  );
}
