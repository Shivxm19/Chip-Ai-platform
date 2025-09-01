// src/pages/tool/chip/components/OutputPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * OutputPanel Component
 * Displays the output log of the RTL tool.
 *
 * @param {object} props - Component props.
 * @param {string} props.outputLog - The text content of the output log.
 * @param {object} props.outputLogRef - React ref for the output log div to enable scrolling.
 * @param {string} props.panelBg - Tailwind class for panel background.
 * @param {string} props.borderColor - Tailwind class for border color.
 * @param {string} props.textColor - Tailwind class for text color.
 * @param {string} props.dimmedText - Tailwind class for dimmed text color.
 */
const OutputPanel = ({ outputLog, outputLogRef, panelBg, borderColor, textColor, dimmedText }) => {
    const BOTTOM_OUTPUT_HEIGHT = '200px'; // Define constant locally or pass as prop

    return (
        <motion.div
            className={`output-log-panel p-4 m-4 mt-0 ${borderColor} border`}
            style={{ height: BOTTOM_OUTPUT_HEIGHT }}
        >
            <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>Output Log</h3>
            <div className={`output-log p-2 custom-scrollbar ${borderColor} border`} ref={outputLogRef} style={{ height: `calc(100% - 40px)` }}>
                {outputLog || "Tool output will appear here."}
            </div>
        </motion.div>
    );
};

export default OutputPanel;
