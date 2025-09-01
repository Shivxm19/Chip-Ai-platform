// src/pages/tool/chip/components/EditorToolbar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaSyncAlt, FaMicrochip } from 'react-icons/fa';

/**
 * EditorToolbar Component
 * Provides quick action buttons (Run, Lint, Synthesize) above the code editor.
 *
 * @param {object} props - Component props.
 * @param {function} props.runSimulation - Function to trigger RTL simulation.
 * @param {function} props.runLint - Function to trigger RTL linting.
 * @param {function} props.runSynthesis - Function to trigger RTL synthesis.
 * @param {string} props.panelBg - Tailwind class for panel background.
 * @param {string} props.borderColor - Tailwind class for border color.
 * @param {string} props.purpleButtonBg - Tailwind class for purple button background.
 * @param {string} props.purpleButtonHoverBg - Tailwind class for purple button hover background.
 * @param {string} props.buttonBg - Tailwind class for general button background.
 * @param {string} props.buttonHoverBg - Tailwind class for general button hover background.
 * @param {string} props.textColor - Tailwind class for text color.
 */
const EditorToolbar = ({
    runSimulation, runLint, runSynthesis,
    panelBg, borderColor, purpleButtonBg, purpleButtonHoverBg, buttonBg, buttonHoverBg, textColor
}) => {
    const EDITOR_TOOLBAR_HEIGHT = '48px'; // Define constant locally or pass as prop

    return (
        <div className={`editor-toolbar ${panelBg} ${borderColor} border m-4 mb-0`} style={{ height: EDITOR_TOOLBAR_HEIGHT }}>
            <motion.button
                onClick={runSimulation}
                className={`editor-toolbar-button ${purpleButtonBg} ${purpleButtonHoverBg} text-white mr-4`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
                <FaPlay /> Run
            </motion.button>
            <motion.button
                onClick={runLint}
                className={`editor-toolbar-button ${buttonBg} ${buttonHoverBg} ${textColor} mr-4`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
                <FaSyncAlt /> Lint
            </motion.button>
            <motion.button
                onClick={runSynthesis}
                className={`editor-toolbar-button ${buttonBg} ${buttonHoverBg} ${textColor}`}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
                <FaMicrochip /> Synthesize
            </motion.button>
        </div>
    );
};

export default EditorToolbar;
