import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TimeoutLoading = ({
    errorMessage = "We've encountered an error. We're redirecting you back to home.",
    redirectPath = '/',
    logDelay = 5000,
    redirectDelay = 10000,
}: {
    errorMessage?: string;
    redirectPath?: string;
    logDelay?: number;
    redirectDelay?: number;
}) => {
    const navigate = useNavigate();

    useEffect(() => {
        const clearStorageTimeout = setTimeout(() => {
            localStorage.clear();
        }, 9000);
        const errorTimeout = setTimeout(() => {
            console.error(errorMessage);
        }, logDelay);

        const redirectTimeout = setTimeout(() => {
            navigate(redirectPath);
        }, redirectDelay);

        return () => {
            clearTimeout(errorTimeout);
            clearTimeout(redirectTimeout);
        };
    }, [navigate, errorMessage, redirectPath, logDelay, redirectDelay]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="loader animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
            </div>
        </div>
    );
};

export default TimeoutLoading;