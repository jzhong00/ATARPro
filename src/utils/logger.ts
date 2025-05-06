import { toast } from 'react-toastify';

export const overrideConsoleError = () => {

    const originalError = console.error;
    const activeErrors = new Set<string>();

    console.error = function (...args) {
        originalError(...args);

        const message = args
        .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
        .join(' ');

        if (activeErrors.has(message)) return;

        activeErrors.add(message);

        toast.error(message, {
        toastId: message,
        position: 'bottom-right',
        style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
        },
        onClose: () => {
            activeErrors.delete(message);
        },
        });
    };
};