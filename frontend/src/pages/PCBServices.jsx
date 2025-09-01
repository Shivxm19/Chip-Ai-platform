// src/components/PcbToolsContent.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaMicrochip, FaVectorSquare, FaBoxes, FaWaveSquare, FaThermometerHalf,
    FaBolt, FaChartArea, FaDownload, FaNetworkWired, FaTools, FaLock, FaRegArrowAltCircleRight
} from 'react-icons/fa';

// Define the PCB tools and their required membership status
const pcbTools = [
    { id: 'schematic-editor', name: 'Schematic Editor', description: 'Design and capture your circuit schematics with intelligent component management.', icon: <FaVectorSquare className="text-red-400 text-4xl mb-4" />, path: '/tool/schematic-editor', requiredPlan: 'standard' },
    { id: 'layout-editor', name: 'Layout Editor', description: 'Intuitively design your PCB layout, from component placement to trace routing.', icon: <FaChartArea className="text-blue-400 text-4xl mb-4" />, path: '/tool/layout-editor', requiredPlan: 'standard' },
    { id: 'component-library', name: 'Component Library', description: 'Manage and access a vast library of electronic components for your designs.', icon: <FaBoxes className="text-green-400 text-4xl mb-4" />, path: '/tool/component-library', requiredPlan: 'standard' },
    { id: 'signal-integrity', name: 'Signal Integrity (SI)', description: 'Analyze signal transmission quality to prevent issues like reflections and crosstalk.', icon: <FaWaveSquare className="text-yellow-400 text-4xl mb-4" />, path: '/tool/signal-integrity', requiredPlan: 'standard' },
    { id: 'power-integrity', name: 'Power Integrity (PI)', description: 'Ensure stable power delivery across your PCB to avoid voltage drops and noise.', icon: <FaBolt className="text-orange-400 text-4xl mb-4" />, path: '/tool/power-integrity', requiredPlan: 'standard' },
    { id: 'thermal-analysis', name: 'Thermal Analysis', description: 'Simulate heat dissipation to identify hot spots and ensure board reliability.', icon: <FaThermometerHalf className="text-purple-400 text-4xl mb-4" />, path: '/tool/thermal-analysis', requiredPlan: 'standard' },
    { id: 'gerber-viewer', name: 'Gerber Viewer', description: 'View and verify industry-standard Gerber files before manufacturing.', icon: <FaDownload className="text-pink-400 text-4xl mb-4" />, path: '/tool/gerber-viewer', requiredPlan: 'standard' },
    { id: 'routing-assistant', name: 'Smart Routing Assistant', description: 'Accelerated trace routing with AI guidance.', icon: <FaNetworkWired className="text-indigo-400 text-4xl mb-4" />, path: '/tool/routing-assistant', requiredPlan: 'free' },
    { id: 'pcb-drc-erc', name: 'PCB DRC/ERC', description: 'Run Design and Electrical Rule Checks specific to PCB manufacturing standards.', icon: <FaTools className="text-teal-400 text-4xl mb-4" />, path: '/tool/pcb-drc-erc', requiredPlan: 'pro' },
    { id: 'manufacturing-output', name: 'Manufacturing Output', description: 'Generate all necessary files for PCB fabrication and assembly.', icon: <FaRegArrowAltCircleRight className="text-green-400 text-4xl mb-4" />, path: '/tool/manufacturing-output', requiredPlan: 'pro' },
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

function PcbToolsContent({ theme, userSubscriptionStatus, hasAccess }) {
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {pcbTools.map((tool, toolIndex) => {
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

export default PcbToolsContent;
