// src/components/modals/ProjectManagementModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSave, FaUpload, FaTrashAlt, FaTimes } from 'react-icons/fa';

/**
 * ProjectManagementModal Component
 * A modal for managing RTL projects (save, load, delete).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {function} props.onClose - Function to close the modal.
 * @param {Array<object>} props.savedProjects - List of saved projects.
 * @param {string} props.selectedProject - ID of the currently selected project in the dropdown.
 * @param {function} props.setSelectedProject - Function to set the selected project ID.
 * @param {string} props.newProjectName - Name for a new project to be saved.
 * @param {function} props.setNewProjectName - Function to set the new project name.
 * @param {function} props.handleSaveProject - Function to handle saving the current project.
 * @param {function} props.handleLoadProject - Function to handle loading a selected project.
 * @param {function} props.handleDeleteProject - Function to handle deleting a selected project.
 * @param {string} props.theme - Current theme ('light' or 'dark').
 * @param {string} props.inputBg - Tailwind class for input background.
 * @param {string} props.textColor - Tailwind class for text color.
 * @param {string} props.dimmedText - Tailwind class for dimmed text color.
 * @param {string} props.borderColor - Tailwind class for border color.
 * @param {string} props.purpleButtonBg - Tailwind class for purple button background.
 * @param {string} props.purpleButtonHoverBg - Tailwind class for purple button hover background.
 * @param {string} props.buttonBg - Tailwind class for general button background.
 * @param {string} props.buttonHoverBg - Tailwind class for general button hover background.
 * @param {object} props.user - Current authenticated user object.
 */
const ProjectManagementModal = ({
    isOpen, onClose, savedProjects, selectedProject, setSelectedProject,
    newProjectName, setNewProjectName, handleSaveProject, handleLoadProject,
    handleDeleteProject, theme, inputBg, textColor, dimmedText, borderColor,
    purpleButtonBg, purpleButtonHoverBg, buttonBg, buttonHoverBg, user
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
                        className={`relative ${theme === 'dark' ? 'bg-[#1a1a23] text-white' : 'bg-white text-gray-900'} p-8 rounded-xl shadow-2xl w-full max-w-lg ${borderColor} border`}
                    >
                        <h3 className="text-2xl font-bold mb-6 text-center">Project Management</h3>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newProjectName" className={`block text-sm font-medium mb-2 ${dimmedText}`}>New Project Name:</label>
                                <input
                                    type="text"
                                    id="newProjectName"
                                    placeholder="Enter project name to save"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className={`input-field w-full ${inputBg} ${textColor} rounded-md p-2`}
                                />
                            </div>
                            <motion.button
                                onClick={handleSaveProject}
                                className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center w-full justify-center ${purpleButtonBg} ${purpleButtonHoverBg} text-white`}
                                disabled={!user || !newProjectName.trim()}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            >
                                <FaSave className="mr-2" /> Save Current Project
                            </motion.button>

                            <div className="border-t border-gray-700 my-4 pt-4">
                                <label htmlFor="selectProject" className={`block text-sm font-medium mb-2 ${dimmedText}`}>Load/Delete Existing Project:</label>
                                <select
                                    id="selectProject"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className={`input-field w-full ${inputBg} ${textColor} rounded-md p-2 mb-2`}
                                >
                                    <option value="">Select Project</option>
                                    {savedProjects.map(project => (
                                        <option key={project.id} value={project.id}>{project.name}</option>
                                    ))}
                                </select>
                                <div className="flex space-x-2">
                                    <motion.button
                                        onClick={handleLoadProject}
                                        className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center flex-grow justify-center ${buttonBg} ${buttonHoverBg} ${textColor}`}
                                        disabled={!selectedProject}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        <FaUpload className="mr-2" /> Load
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDeleteProject}
                                        className={`font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center flex-grow justify-center bg-red-600 hover:bg-red-700 text-white`}
                                        disabled={!selectedProject || !user}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    >
                                        <FaTrashAlt className="mr-2" /> Delete
                                    </motion.button>
                                </div>
                            </div>
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

export default ProjectManagementModal;
