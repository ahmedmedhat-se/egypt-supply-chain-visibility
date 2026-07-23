// src/components/ui/Toast.tsx
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      icon: <FaCheckCircle className="w-5 h-5" />,
      style: {
        background: '#065F46',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  },
  error: (message: string) => {
    toast.error(message, {
      icon: <FaTimesCircle className="w-5 h-5" />,
      style: {
        background: '#991B1B',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  },
  warning: (message: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#92400E] shadow-lg rounded-lg pointer-events-auto flex items-center p-4`}>
        <FaExclamationCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
        <span className="text-white font-medium">{message}</span>
      </div>
    ));
  },
  info: (message: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1E40AF] shadow-lg rounded-lg pointer-events-auto flex items-center p-4`}>
        <FaInfoCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
        <span className="text-white font-medium">{message}</span>
      </div>
    ));
  },
};