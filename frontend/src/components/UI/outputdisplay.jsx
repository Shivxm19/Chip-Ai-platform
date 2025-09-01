// src/components/ui/OutputDisplay.jsx
import React, { forwardRef } from 'react';
import Panel from './panel'; // Import Panel to reuse its styling

// Using forwardRef to allow parent components to get a ref to the pre element for scrolling
const OutputDisplay = forwardRef(({ content, title, className = '' }, ref) => (
    <Panel title={title} className={`flex-grow flex flex-col ${className}`}>
        <pre ref={ref} className="bg-[#0d0d12] border border-[#333345] rounded-lg p-3 flex-grow overflow-y-auto font-mono text-sm text-[#a0aec0] whitespace-pre-wrap break-all custom-scrollbar">
            {content}
        </pre>
    </Panel>
));

export default OutputDisplay;
