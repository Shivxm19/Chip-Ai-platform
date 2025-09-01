    // src/components/UI/textareafield.jsx
    import React from 'react';

    const TextAreaField = ({ id, name, value, onChange, placeholder, rows = 3, className = '', disabled = false, required = false }) => {
        return (
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className={`textarea-field block w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
                disabled={disabled}
                required={required}
            />
        );
    };

    export default TextAreaField;
    