// src/components/PlatformToolsContent.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaCloud, FaBrain, FaGitAlt, FaChartBar, FaKey, FaBoxes,
    FaCode, FaLaptopCode, FaTruckLoading, FaUsers, FaTools, FaLock,
    FaShareAlt, FaDownload, FaCloudUploadAlt, FaComments // Added new icons for mock tools
} from 'react-icons/fa';

// Define the Platform tools and their required membership status
const platformTools = [
    { id: 'cloud-eda', name: 'Cloud EDA Environment', description: 'Scalable cloud infrastructure for all your chip and PCB design workflows.', icon: <FaCloud className="text-blue-300 text-4xl mb-4" />, path: '/tool/cloud-eda', requiredPlan: 'standard' },
    { id: 'ai-copilot', name: 'AI-Powered Co-Pilot', description: 'Intelligent AI assistance for design optimization, debugging, and code generation.', icon: <FaBrain className="text-purple-300 text-4xl mb-4" />, path: '/tool/ai-copilot', requiredPlan: 'standard' },
    { id: 'project-collaboration', name: 'Project Collaboration', description: 'Seamless team collaboration and version control for design projects.', icon: <FaGitAlt className="text-orange-300 text-4xl mb-4" />, path: '/tool/project-collaboration', requiredPlan: 'free' },
    { id: 'team-management', name: 'Team Management', description: 'Tools to manage user roles, permissions, and team access within the platform.', icon: <FaUsers className="text-indigo-300 text-4xl mb-4" />, path: '/tool/team-management', requiredPlan: 'standard' },
    { id: 'utilities-diagnostics', name: 'Utilities & Diagnostics', description: 'A suite of utility tools for debugging, diagnostics, and system health monitoring.', icon: <FaTools className="text-gray-300 text-4xl mb-4" />, path: '/tool/utilities-diagnostics', requiredPlan: 'standard' },
    { id: 'data-analytics', name: 'Design Data Analytics', description: 'Gain insights from your design data to improve efficiency and predict outcomes.', icon: <FaChartBar className="text-green-300 text-4xl mb-4" />, path: '/tool/data-analytics', requiredPlan: 'pro' },
    { id: 'ip-management', name: 'IP Management', description: 'Securely manage, version, and license your Intellectual Property assets.', icon: <FaKey className="text-red-300 text-4xl mb-4" />, path: '/tool/ip-management', requiredPlan: 'pro' },
    { id: 'foundry-integration', name: 'Foundry Integration', description: 'Direct integration with leading foundries for design kit access and tape-out.', icon: <FaBoxes className="text-yellow-300 text-4xl mb-4" />, path: '/tool/foundry-integration', requiredPlan: 'pro' },
    { id: 'api-development', name: 'Custom API Development', description: 'Extend platform capabilities with custom APIs and scripting for unique workflows.', icon: <FaCode className="text-cyan-300 text-4xl mb-4" />, path: '/tool/api-development', requiredPlan: 'pro' },
    { id: 'hw-sw-co-design', name: 'Hardware-Software Co-design', description: 'Tools for concurrent development and verification of hardware and software.', icon: <FaLaptopCode className="text-pink-300 text-4xl mb-4" />, path: '/tool/hw-sw-co-design', requiredPlan: 'pro' },
    { id: 'supply-chain', name: 'Supply Chain Integration', description: 'Streamline your manufacturing process with integrated supply chain management.', icon: <FaTruckLoading className="text-lime-300 text-4xl mb-4" />, path: '/tool/supply-chain', requiredPlan: 'pro' },
    // Mock tools for dashboard sidebar 'Tools' section
    { id: 'file-sharing', name: 'File Sharing', description: 'Securely share design files and project assets with your team or external partners.', icon: <FaShareAlt className="text-blue-400 text-4xl mb-4" />, path: '/tool/file-sharing', requiredPlan: 'standard' },
    { id: 'download-manager', name: 'Download Manager', description: 'Manage and track all your design output files, reports, and generated assets.', icon: <FaDownload className="text-green-400 text-4xl mb-4" />, path: '/tool/download-manager', requiredPlan: 'free' },
    { id: 'cloud-storage', name: 'Cloud Storage', description: 'Centralized and scalable cloud storage for all your project data and libraries.', icon: <FaCloudUploadAlt className="text-purple-400 text-4xl mb-4" />, path: '/tool/cloud-storage', requiredPlan: 'standard' },
    { id: 'realtime-collaboration', name: 'Real-time Collaboration', description: 'Engage in live, synchronized editing and communication on design projects.', icon: <FaComments className="text-red-400 text-4xl mb-4" />, path: '/tool/realtime-collaboration', requiredPlan: 'pro' },
];

const toolCardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 10 } },
    hover: {
        translateY: -8,
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.6)",
        backgroundColor: 'var(--hover-card-bg)',
        borderColor: 'var(--hover-card-border)',
    },
    tap: { scale: 0.95 }
};

const lockedOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
};

function PlatformToolsContent({ theme, userSubscriptionStatus, hasAccess }) {
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {platformTools.map((tool, toolIndex) => {
                const locked = !hasAccess(tool.requiredPlan);
                return (
                    <motion.div
                        key={tool.id}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap="tap"
                        variants={toolCardVariants}
                        className={`relative sub-service-item ${locked ? 'disabled' : ''}`}
                    >
                        {tool.icon}
                        <h3 className={`text-2xl font-semibold mb-2 ${locked ? dimmedText : textColor}`}>{tool.name}</h3>
                        <p className={`text-gray-400 text-sm mb-4 min-h-[40px] flex items-center text-center`}>
                            {tool.description}
                        </p>
                        <div className="flex justify-between items-center w-full">
                            {locked ? (
                                <button
                                    disabled
                                    className="access-button opacity-50 cursor-not-allowed"
                                >
                                    Access Tool
                                </button>
                            ) : (
                                <Link
                                    to={tool.path}
                                    className="access-button"
                                >
                                    Launch Tool
                                </Link>
                            )}
                        </div>

                        {locked && (
                            <motion.div
                                variants={lockedOverlayVariants}
                                initial="hidden"
                                animate="visible"
                                className="tool-card-overlay absolute inset-0 rounded-xl flex items-center justify-center flex-col p-4 text-center"
                            >
                                <FaLock className={`text-5xl mb-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {tool.requiredPlan.charAt(0).toUpperCase() + tool.requiredPlan.slice(1)} Feature
                                </p>
                                <Link to="/pricing" className="btn-gradient text-white py-2 px-4 rounded-full text-sm font-semibold mt-3">
                                    Unlock Now
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

export default PlatformToolsContent;
