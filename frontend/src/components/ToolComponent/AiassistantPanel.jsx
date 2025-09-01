// src/components/modals/AIAssistantModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaLightbulb, FaTimes } from 'react-icons/fa';

/**
 * AIAssistantModal Component
 * A modal for interacting with the AI assistant.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {function} props.onClose - Function to close the modal.
 * @param {string} props.aiPrompt - Current prompt text for the AI.
 * @param {function} props.setAiPrompt - Function to set the AI prompt text.
 * @param {string} props.aiResponse - Response text from the AI.
 * @param {boolean} props.aiLoading - Whether the AI is currently generating a response.
 * @param {string} props.aiFunction - The selected AI function (e.g., 'general_query', 'explain_code').
 * @param {function} props.setAiFunction - Function to set the selected AI function.
 * @param {function} props.handleAIAssist - Function to trigger AI assistance.
 * @param {string} props.theme - Current theme ('light' or 'dark').
 * @param {string} props.inputBg - Tailwind class for input background.
 * @param {string} props.textColor - Tailwind class for text color.
 * @param {string} props.dimmedText - Tailwind class for dimmed text color.
 * @param {string} props.borderColor - Tailwind class for border color.
 * @param {string} props.purpleButtonBg - Tailwind class for purple button background.
 * @param {string} props.purpleButtonHoverBg - Tailwind class for purple button hover background.
 */
const AIAssistantModal = ({
    isOpen, onClose, aiPrompt, setAiPrompt, aiResponse, aiLoading,
    aiFunction, setAiFunction, handleAIAssist, theme, inputBg,
    textColor, dimmedText, borderColor, purpleButtonBg, purpleButtonHoverBg
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={`relative ${theme === 'dark' ? 'bg-[#1a1a23] text-white' : 'bg-white text-gray-900'} p-8 rounded-xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col ${borderColor} border`}
                    >
                        <h3 className="text-2xl font-bold mb-6 text-center">AI Assistant Chat</h3>

                        <div className="flex-grow flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-2">
                            <div className="mb-4">
                                <label htmlFor="aiFunctionSelect" className={`block text-sm font-medium mb-2 ${dimmedText}`}>Choose AI Function:</label>
                                <select
                                    id="aiFunctionSelect"
                                    className={`input-field w-full ${inputBg} ${textColor} rounded-md p-2`}
                                    value={aiFunction || ''}
                                    onChange={(e) => {
                                        setAiFunction(e.target.value);
                                        setAiPrompt('');
                                        setAiResponse('');
                                    }}
                                >
                                    <option value="general_query">General Query</option>
                                    <option value="explain_code">Explain Current RTL</option>
                                    <option value="optimization_suggestion">Suggest RTL Optimizations</option>
                                    <option value="generate_testbench">Generate Testbench</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label htmlFor="aiPromptInput" className={`block text-sm font-medium mb-2 ${dimmedText}`}>Your Prompt:</label>
                                <textarea
                                    id="aiPromptInput"
                                    className={`input-field w-full min-h-[100px] ${inputBg} ${textColor} rounded-md p-2`}
                                    placeholder={aiFunction === 'explain_code' ? 'AI will explain the current RTL code.' :
                                                 aiFunction === 'optimization_suggestion' ? 'AI will suggest optimizations for the current RTL code.' :
                                                 aiFunction === 'generate_testbench' ? 'AI will generate a testbench for the current RTL code.' :
                                                 'Ask me anything about digital logic, Verilog, or this tool...'}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    disabled={aiFunction !== 'general_query'}
                                ></textarea>
                            </div>
                            <motion.button
                                className={`btn-gradient text-white font-bold py-2 px-6 rounded-md shadow-md flex items-center w-full justify-center`}
                                onClick={handleAIAssist}
                                disabled={aiLoading || (!aiPrompt.trim() && aiFunction === 'general_query')}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                                {aiLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaLightbulb className="mr-2" />}
                                {aiLoading ? 'Thinking...' : 'Get AI Help'}
                            </motion.button>
                            {aiResponse && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`mt-6 p-4 rounded-md ${inputBg} ${borderColor} border overflow-auto max-h-64 custom-scrollbar`}
                                >
                                    <h4 className={`font-semibold mb-2 ${textColor}`}>AI Response:</h4>
                                    <p className={`whitespace-pre-wrap text-sm ${dimmedText}`}>{aiResponse}</p>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            aria-label="Close modal"
                        >
                            <FaTimes className="w-6 h-6" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIAssistantModal;
