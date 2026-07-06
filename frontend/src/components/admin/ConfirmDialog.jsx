import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className={`flex items-center gap-2 ${type === 'danger' ? 'text-red-600' : 'text-blue-600'}`}>
            <AlertTriangle size={20} />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
