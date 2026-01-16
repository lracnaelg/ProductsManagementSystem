import { useState } from 'react';
import './Toast.css';

export const ToastComponent = ({ toast, setToast }) => {
  if (!toast.show) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>
      <button onClick={() => setToast({ show: false, message: '', type: 'info' })} className="toast-close">
        ×
      </button>
    </div>
  );
};
