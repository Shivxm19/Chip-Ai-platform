// src/components/ui/Panel.jsx
import React from 'react';

const Panel = ({ children, title, className = '', ...props }) => (
    <div className={`bg-[#1a1a23] p-4 rounded-xl shadow-lg ${className}`} {...props}>
        {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}
        {children}
    </div>
);

export default Panel;
