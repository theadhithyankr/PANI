import toast from 'react-hot-toast';

export const useToast = () => {
  return {
    success: (msg, opts) => toast.success(msg, opts),
    error: (msg, opts) => toast.error(msg, opts),
    custom: (msg, opts) => toast(msg, opts),
    promise: toast.promise,
    dismiss: toast.dismiss,
  };
}; 