// src/components/ui/SelectField.jsx
import React from 'react';

const SelectField = ({ value, onChange, options, className = '', disabled = false, ...props }) => (
    <select
        value={value}
        onChange={onChange}
        className={`bg-[#1a1a23] border border-[#333345] text-[#e0e0e0] p-3 rounded-lg outline-none focus:border-[#a78bfa] transition-colors duration-200 ${className}`}
        disabled={disabled}
        {...props} // Pass through any other props
    >
        {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
        ))}
    </select>
);

export default SelectField;
