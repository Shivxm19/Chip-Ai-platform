// src/components/ui/InputField.jsx
import React from 'react';

const InputField = ({ type = 'text', value, onChange, placeholder, className = '', disabled = false, ...props }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`bg-[#1a1a23] border border-[#333345] text-[#e0e0e0] p-3 rounded-lg outline-none focus:border-[#a78bfa] transition-colors duration-200 ${className}`}
        disabled={disabled}
        {...props} // Pass through any other props like id, name, etc.
    />
);

export default InputField;
