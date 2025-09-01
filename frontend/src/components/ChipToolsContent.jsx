// src/components/ChipToolsContent.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaMicrochip, FaCogs, FaChartLine, FaPuzzlePiece, FaCheckDouble,
    FaFileCode, FaDraftingCompass, FaBolt, FaBatteryFull, FaClock,
    FaTh, FaSitemap, FaEye, FaExclamationTriangle, FaAward, FaHeartbeat, FaLock
} from 'react-icons/fa';

// Define the Chip tools and their required membership status
const chipTools = [
    { id: 'rtl-editor', name: 'RTL Editor', description: 'Design and edit your Register Transfer Level (RTL) code for chip functionality.', icon: <FaFileCode className="text-red-500 text-4xl mb-4" />, path: '/tools/chip/rtl-editor', requiredPlan: 'free' },
    { id: 'synthesis-tool', name: 'Synthesis Tool', description: 'Convert your RTL code into a gate-level netlist, optimizing for area, speed, and power.', icon: <FaCogs className="text-blue-500 text-4xl mb-4" />, path: '/tool/synthesis-tool', requiredPlan: 'standard' },
    { id: 'rtl-simulation', name: 'RTL Simulation', description: 'Verify the functional correctness of your RTL design using simulated inputs and outputs.', icon: <FaChartLine className="text-green-500 text-4xl mb-4" />, path: '/tool/chip/rtl-simulation', requiredPlan: 'standard' },
    { id: 'static-timing', name: 'Static Timing Analysis (STA)', description: 'Analyze critical path delays and ensure your design meets timing constraints.', icon: <FaClock className="text-yellow-500 text-4xl mb-4" />, path: '/tool/static-timing', requiredPlan: 'standard' },
    { id: 'floorplanning', name: 'Floorplanning', description: 'Define the overall chip area and arrange major functional blocks for optimal layout.', icon: <FaTh className="text-purple-500 text-4xl mb-4" />, path: '/tool/floorplanning', requiredPlan: 'standard' },
    { id: 'placement-routing', name: 'Placement & Routing', description: 'Precisely place standard cells and route interconnections to complete the physical design.', icon: <FaSitemap className="text-pink-500 text-4xl mb-4" />, path: '/tool/placement-routing', requiredPlan: 'standard' },
    { id: 'gdsii-viewer', name: 'GDSII Viewer', description: 'Visualize the final GDSII layout, the industry-standard format for chip fabrication.', icon: <FaEye className="text-indigo-500 text-4xl mb-4" />, path: '/tool/gdsii-viewer', requiredPlan: 'standard' },
    { id: 'drc-checks', name: 'DRC Checks', description: 'Automated checks to ensure your physical layout adheres to manufacturing rules.', icon: <FaExclamationTriangle className="text-teal-500 text-4xl mb-4" />, path: '/tool/drc-checks', requiredPlan: 'standard' },
    { id: 'erc-checks', name: 'ERC Checks', description: 'Electrical rule checks to verify connectivity and prevent electrical design flaws.', icon: <FaBolt className="text-orange-500 text-4xl mb-4" />, path: '/tool/erc-checks', requiredPlan: 'standard' },
    { id: 'power-analysis', name: 'Power Analysis', description: 'Analyze and optimize power consumption for energy-efficient chip designs.', icon: <FaBatteryFull className="text-lime-500 text-4xl mb-4" />, path: '/tool/power-analysis', requiredPlan: 'standard' },
    { id: 'formal-verification', name: 'Formal Verification', description: 'Mathematically prove the correctness of your design against its specifications.', icon: <FaAward className="text-cyan-500 text-4xl mb-4" />, path: '/tool/formal-verification', requiredPlan: 'pro' },
    { id: 'reliability-analysis', name: 'Reliability Analysis', description: 'Assess the long-term reliability and robustness of your chip design.', icon: <FaHeartbeat className="text-red-300 text-4xl mb-4" />, path: '/tool/reliability-analysis', requiredPlan: 'pro' },
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

function ChipToolsContent({ theme, userSubscriptionStatus, hasAccess }) {
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {chipTools.map((tool, toolIndex) => {
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

export default ChipToolsContent;
