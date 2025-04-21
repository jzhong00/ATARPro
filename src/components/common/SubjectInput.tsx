import React from 'react';

// Define SubjectMapping here, mirroring the one in the service/calculator
// TODO: Move to a shared types file or export from service
interface SubjectMapping {
  Subject_name: string;
  Subject_display: string;
  Type: string;
  Validation: string;
  a?: number;
  k?: number;
}

interface SubjectInputProps {
  value: string | null;
  onChange: (value: string) => void;
  subjects: SubjectMapping[]; // Accept the list of subjects
}

const SubjectInput: React.FC<SubjectInputProps> = ({ value, onChange, subjects }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  // Handle Enter and Backspace key presses
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const currentValue = (event.target as HTMLInputElement).value;

    if (event.key === 'Enter') {
      event.preventDefault();
      // Ensure the latest value is processed by the parent's onChange
      onChange(currentValue);
      // TODO: Consider moving focus to the next input (ResultInput) if needed.
    } else if (event.key === 'Backspace' && currentValue !== '') {
      // If backspace is pressed and input is not already empty,
      // trigger a clear action by passing an empty string to onChange.
      // We might need to preventDefault if the browser fights the clear.
      // event.preventDefault(); // Uncomment if clearing doesn't work reliably
      onChange('');
    }
  };

  const datalistId = "subject-list"; // ID for the datalist

  return (
    <>
      <input
        type="text"
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown} // Add keydown handler
        placeholder="Enter Subject..."
        className="w-full px-2 py-1 border border-gray-300 rounded shadow-sm text-sm"
        list={datalistId} // Link input to datalist
        autoComplete="off" // Prevent browser autocomplete interfering with datalist
      />
      <datalist id={datalistId}>
        {subjects.map((subject) => (
          <option
            key={subject.Subject_name}
            value={subject.Subject_display}
          >
            {subject.Subject_display}
          </option>
        ))}
      </datalist>
    </>
  );
};

export default SubjectInput; 