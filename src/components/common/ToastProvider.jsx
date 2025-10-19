import { Toaster } from 'react-hot-toast';

const ToastProvider = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontSize: '1rem',
          borderRadius: '0.5rem',
          background: '#fff',
          color: '#222',
        },
        success: { style: { background: '#e0f7fa', color: '#00796b' } },
        error: { style: { background: '#ffebee', color: '#c62828' } },
      }}
    />
  </>
);

export default ToastProvider; 