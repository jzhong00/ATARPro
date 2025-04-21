import React from 'react';

interface ModalButton {
  text: string;
  onClick: () => void;
  styleClass?: string; // Optional Tailwind classes for styling
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose?: () => void; // Optional: Action when clicking overlay or an explicit close button (if added)
  title: string;
  message: string;
  buttons: ModalButton[];
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttons,
}) => {
  if (!isOpen) {
    return null;
  }

  // Prevent closing when clicking inside the modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close when clicking the overlay (optional)
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
        onClick={handleContentClick}
      >
        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {/* Message */}
        <p className="text-gray-700 mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={`px-4 py-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                button.styleClass || 'bg-gray-500 hover:bg-gray-600 text-white' // Default style
              }`}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 