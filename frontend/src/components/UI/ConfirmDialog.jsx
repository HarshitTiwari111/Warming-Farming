import Modal from './Modal'

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  const variants = {
    danger: 'btn-danger',
    primary: 'btn-primary',
    success: 'btn-success',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={onConfirm} className={variants[variant]}>{confirmText}</button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
