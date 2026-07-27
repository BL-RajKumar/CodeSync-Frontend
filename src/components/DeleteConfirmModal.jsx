import React from 'react';
import { createPortal } from 'react-dom';
import { AlertOctagon, X } from 'lucide-react';
import Button from './Button';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title = 'Delete CodePad', message = 'Are you sure you want to delete this codepad? This action cannot be undone.', loading }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in">
      <div className="w-full max-w-[440px] p-6 glass-panel border border-red-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Subtle top red glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500/0 via-red-500/40 to-red-500/0" />

        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={loading}
          className="absolute top-4 right-4 bg-transparent border-none text-muted cursor-pointer p-2 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-white/10 hover:text-main disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Modal Header & Icon */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <AlertOctagon size={24} />
          </div>
          
          <h2 className="text-xl font-bold text-main m-0 mb-2">{title}</h2>
          <p className="text-muted text-sm leading-relaxed m-0 mb-6 max-w-[340px]">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;
