// src/components/ui/Button.jsx
import React from 'react';

const Button = ({ children, onClick, className = '', disabled = false, variant = 'primary', type = 'button', icon: Icon = null }) => {
    const baseStyle = "font-bold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 flex items-center justify-center space-x-2";
    let variantStyle = "";

    switch (variant) {
        case 'primary':
            variantStyle = "bg-purple-600 hover:bg-purple-700 text-white"; // Matches dashboard accent
            break;
        case 'secondary':
            variantStyle = "bg-gray-700 hover:bg-gray-600 text-white"; // Matches dashboard 'back' button
            break;
        case 'success':
            variantStyle = "bg-green-600 hover:bg-green-700 text-white";
            break;
        case 'info':
            variantStyle = "bg-blue-600 hover:bg-blue-700 text-white";
            break;
        case 'danger':
            variantStyle = "bg-red-600 hover:bg-red-700 text-white";
            break;
        default:
            variantStyle = "bg-purple-600 hover:bg-purple-700 text-white";
    }

    // Handle disabled state styling explicitly if needed, otherwise browser default will apply
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
        <button
            type={type} // 'button', 'submit', 'reset'
            onClick={onClick}
            className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
            disabled={disabled}
        >
            {Icon && <Icon className="w-5 h-5" />} {/* Render icon if provided */}
            {children}
        </button>
    );
};

export default Button;
