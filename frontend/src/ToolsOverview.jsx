// src/pages/ToolsOverview.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaBars, FaCog, FaSignOutAlt, FaUserCircle, FaLock, FaCheckCircle,
    FaSun, FaMoon, FaMoneyBillWave, FaHome, FaTools, FaTimes,
    FaMicrochip, FaVectorSquare, FaLaptopCode, FaComments, FaArrowRight,
    FaArrowLeft, FaEllipsisV, FaFileCode, FaBoxes, FaWaveSquare, FaThermometerHalf,
    FaBolt, FaChartArea, FaDownload, FaNetworkWired, FaCloudUploadAlt, FaBrain,
    FaGitAlt, FaKey, FaPuzzlePiece, FaInfoCircle, FaGraduationCap, FaBook, FaExclamationCircle,
    FaClock, FaCogs, FaProjectDiagram, FaCloud, FaShieldAlt, FaLightbulb, FaRobot,
    FaEye, FaTh, FaSitemap, FaExclamationTriangle, FaAward, FaTruckLoading, FaFlask, FaCodeBranch, FaChartLine, FaQuestionCircle, FaPencilRuler, FaVials, FaHammer, FaCube, FaFolder, FaUsers
} from 'react-icons/fa';

// Import Firebase services directly from firebaseconfig.js
import { auth, signOut } from './firebaseconfig';
// Import getMyProfile from authService
import { getMyProfile } from './services/authService';
// Assuming a centralized AuthContext is used for user state
import { useAuth } from './context/AuthContext';
import BackButton from './components/BackButton';


// CORRECTED: A mock Button component to resolve the 'Button is not defined' error
const Button = ({ children, onClick, disabled, variant = 'primary' }) => {
    const baseClasses = "font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out text-sm shadow-md";
    const variants = {
        primary: "bg-purple-600 text-white hover:bg-purple-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    };
    const classNames = `${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
    
    return <button onClick={onClick} disabled={disabled} className={classNames}>{children}</button>;
};


// --- Comprehensive Tool Data ---
const allTools = [
    // Chip Design Tools
    { id: 'schematic-editor-chip', category: 'chip', icon: FaMicrochip, name: 'Schematic Editor (Chip)', shortDescription: 'Create and manage chip schematics.', fullExplanation: 'A web-based schematic editor for chip design, enabling you to create, edit, and manage your digital and analog circuit schematics.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/schematic-editor-chip' },
    { id: 'rtl-code-editor', category: 'chip', icon: FaFileCode, name: 'RTL Code Editor', shortDescription: 'Write and edit RTL code in your browser.', fullExplanation: 'An integrated editor for writing and editing RTL code (Verilog, VHDL, SystemVerilog) with syntax highlighting and basic error checking.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/rtl-code-editor' },
    { id: 'rtl-simulator', category: 'chip', icon: FaVials, name: 'RTL Simulator (Web)', shortDescription: 'Simulate RTL designs directly in your browser.', fullExplanation: 'A web-based RTL simulator to verify the functionality of your digital designs without needing a local setup.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/rtl-simulator' },
    { id: 'logic-synthesizer', category: 'chip', icon: FaLightbulb, name: 'Logic Synthesizer', shortDescription: 'Convert RTL code to gate-level netlists.', fullExplanation: 'A tool that synthesizes your RTL code into an optimized gate-level netlist, preparing it for physical design.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/logic-synthesizer' },
    { id: 'static-timing-analyzer', category: 'chip', icon: FaChartLine, name: 'Static Timing Analyzer', shortDescription: 'Analyze timing of digital circuits.', fullExplanation: 'A tool to perform static timing analysis, identifying critical paths and potential timing violations in your chip design.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/static-timing-analyzer' },
    { id: 'drc-lvs-verifier', category: 'chip', icon: FaHammer, name: 'DRC & LVS Verifier', shortDescription: 'Check for design rule violations and layout correctness.', fullExplanation: 'Verifies your physical layout against design rules (DRC) and compares it with your schematic (LVS) to ensure correctness.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/drc-lvs-verifier' },
    { id: 'floorplanner-pnr', category: 'chip', icon: FaProjectDiagram, name: 'Floorplanner + PnR Tool', shortDescription: 'Automated placement and routing of components.', fullExplanation: 'A tool for floorplanning and place-and-route (PnR), automating the physical implementation of your chip design.', requiredPlan: 'enterprise', status: 'Coming Soon', linkTo: '/tools/floorplanner-pnr' },
    
    // PCB Design Tools
    { id: 'schematic-editor-pcb', category: 'pcb', icon: FaPencilRuler, name: 'Schematic Editor (PCB)', shortDescription: 'Design circuit schematics for PCBs.', fullExplanation: 'An intuitive schematic capture environment for designing complex electronic circuits for PCB projects.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/pcb-schematic-editor' },
    { id: 'pcb-layout-designer', category: 'pcb', icon: FaLaptopCode, name: 'PCB Layout Designer', shortDescription: 'Design multi-layer PCB layouts.', fullExplanation: 'A comprehensive tool for designing multi-layer PCB layouts with advanced routing and layer management capabilities.', requiredPlan: 'standard', status: 'Available', linkTo: '/tools/pcb-layout-designer' },
    { id: 'component-library-manager', category: 'pcb', icon: FaCube, name: 'Component Library Manager', shortDescription: 'Manage and create custom component libraries.', fullExplanation: 'A tool to manage and create your own component libraries, including footprints, symbols, and 3D models.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/component-library-manager' },
    { id: 'ai-auto-router', category: 'pcb', icon: FaLightbulb, name: 'AI Auto-Router', shortDescription: 'AI-powered automated PCB trace routing.', fullExplanation: 'An AI-driven auto-router that automatically places and routes traces on your PCB, optimizing for signal integrity and manufacturability.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/ai-auto-router' },
    { id: 'drc-checker-pcb', category: 'pcb', icon: FaHammer, name: 'DRC Checker (PCB)', shortDescription: 'Check PCB layouts for design rule violations.', fullExplanation: 'A tool to perform Design Rule Checking (DRC) on your PCB layouts, ensuring compliance with manufacturing constraints.', requiredPlan: 'standard', status: 'Available', linkTo: '/tools/drc-checker-pcb' },
    { id: 'signal-integrity-analyzer', category: 'pcb', icon: FaWaveSquare, name: 'Signal Integrity Analyzer', shortDescription: 'Analyze and optimize signal quality on PCBs.', fullExplanation: 'A tool to perform pre-layout and post-layout signal integrity analysis, identifying issues like reflections and crosstalk.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/signal-integrity-analyzer' },
    { id: 'gerber-bom-generator', category: 'pcb', icon: FaFileCode, name: 'Gerber & BOM Generator', shortDescription: 'Generate manufacturing files and Bill of Materials.', fullExplanation: 'A tool to generate all necessary manufacturing files (Gerber, Drill) and a Bill of Materials (BOM) for seamless PCB fabrication and assembly.', requiredPlan: 'standard', status: 'Available', linkTo: '/tools/gerber-bom-generator' },
    { id: '3d-pcb-viewer', category: 'pcb', icon: FaEye, name: '3D PCB Viewer', shortDescription: 'Visualize your PCB design in 3D.', fullExplanation: 'A powerful 3D viewer to inspect your PCB design in a realistic environment, helping to identify mechanical interferences and placement issues.', requiredPlan: 'free', status: 'Coming Soon', linkTo: '/tools/3d-pcb-viewer' },

    // Platform Tools (Exclusive to Your Website)
    { id: 'ai-chat-assistant', category: 'platform', icon: FaComments, name: 'AI Chat Assistant', shortDescription: 'Your intelligent AI co-pilot for general design queries.', fullExplanation: 'A conversational AI assistant powered by advanced LLMs to provide real-time help, explain EDA concepts, and offer quick guidance across all design disciplines.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/ai-chat-assistant' },
    { id: 'project-manager', category: 'platform', icon: FaFolder, name: 'Project Manager', shortDescription: 'A centralized hub for all your projects.', fullExplanation: 'A robust project manager to organize your chip and PCB designs, track progress, and manage design revisions with ease.', requiredPlan: 'free', status: 'Available', linkTo: '/project-management' },
    { id: 'live-collaboration-tool', category: 'platform', icon: FaUsers, name: 'Live Collaboration Tool', shortDescription: 'Collaborate with your team in real-time.', fullExplanation: 'A tool that enables real-time collaboration on design projects, with features like shared editing, commenting, and version control.', requiredPlan: 'standard', status: 'Coming Soon', linkTo: '/tools/live-collaboration' },
    { id: 'ai-debug-assistant', category: 'platform', icon: FaBrain, name: 'AI Debug Assistant', shortDescription: 'AI-powered debugging for your code and designs.', fullExplanation: 'An intelligent assistant that uses AI to analyze your RTL code or design files and provide suggestions for debugging and fixing errors.', requiredPlan: 'pro', status: 'Coming Soon', linkTo: '/tools/ai-debug-assistant' },
    { id: 'cloud-storage-sharing', category: 'platform', icon: FaCloud, name: 'Cloud Storage & Sharing', shortDescription: 'Secure cloud storage with sharing capabilities.', fullExplanation: 'Secure, scalable cloud storage for all your design files with sharing capabilities, allowing you to easily collaborate with your team.', requiredPlan: 'free', status: 'Available', linkTo: '/tools/cloud-storage-sharing' },
    { id: 'design-to-fabrication-flow', category: 'platform', icon: FaTools, name: 'Design-to-Fabrication Flow', shortDescription: 'Streamlined flow from design to manufacturing.', fullExplanation: 'A comprehensive toolchain that integrates your design process with the fabrication and assembly flow, ensuring a smooth transition from design to physical product.', requiredPlan: 'enterprise', status: 'Coming Soon', linkTo: '/tools/design-to-fabrication' },
    { id: 'sim-dash', category: 'platform', icon: FaChartLine, name: 'Sim-Dash (Simulation Dashboard)', shortDescription: 'Visualize and analyze simulation data.', fullExplanation: 'A dashboard for visualizing and analyzing simulation data, providing insights into your design\'s performance and behavior with interactive charts and graphs.', requiredPlan: 'standard', status: 'Coming Soon', linkTo: '/tools/sim-dash' },
    { id: 'learning-mode-ai-tutor', category: 'platform', icon: FaBook, name: 'Learning Mode + AI Tutor', shortDescription: 'An AI tutor to guide you through design concepts.', fullExplanation: 'A personalized AI tutor that provides interactive lessons and guidance on chip and PCB design concepts, helping you learn and master new skills at your own pace.', requiredPlan: 'standard', status: 'Coming Soon', linkTo: '/tools/ai-tutor' },
    { id: 'toolchain-integrator', category: 'platform', icon: FaCogs, name: 'Toolchain Integrator', shortDescription: 'Integrate with third-party tools.', fullExplanation: 'A toolchain integrator that allows you to seamlessly integrate your existing third-party EDA tools and scripts with the platform.', requiredPlan: 'enterprise', status: 'Coming Soon', linkTo: '/tools/toolchain-integrator' },
];

const planHierarchy = {
    'free': 0,
    'standard': 1,
    'premium': 2,
    'pro': 3,
    'enterprise': 4,
};

const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const sectionTitleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.2 } }
};
const sidebarVariants = {
    closed: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
    open: { x: '0%', opacity: 1, transition: { type: "spring", stiffness: 200, damping: 25 } },
};
const toolCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 10 } },
    hover: {
        translateY: -8,
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.4)",
        borderColor: '#bb37a9',
    },
    tap: { scale: 0.95 }
};
const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};
const modalContentVariants = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
    exit: { y: "100vh", opacity: 0 },
};
const contentTransitionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
};

const ToolDetailModal = ({ theme, tool, onClose, hasAccess, userMembershipStatus }) => {
    const navigate = useNavigate();
    const modalBg = theme === 'dark' ? 'bg-[#1a1a23]' : 'bg-white';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    if (!tool) return null;

    const isAccessible = hasAccess(tool.requiredPlan);
    const showUpgradeButton = !isAccessible && tool.status !== 'Coming Soon';

    const handleLaunchTool = () => {
        if (tool.status === 'Available' && tool.linkTo) {
            navigate(tool.linkTo);
            onClose();
        } else if (tool.status === 'Coming Soon') {
            alert(`Tool "${tool.name}" is coming soon!`);
            onClose();
        } else if (!isAccessible) {
            alert(`You need to upgrade your plan to access "${tool.name}".`);
            onClose();
        } else {
            console.log(`Attempted to launch tool ${tool.name} (ID: ${tool.id}) but no specific linkTo defined or status is not 'Available'.`);
            alert(`Tool "${tool.name}" is not yet fully integrated with a dedicated page.`);
            onClose();
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <motion.div
                className={`relative ${modalBg} ${textColor} p-8 rounded-xl shadow-2xl w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh]`}
                variants={modalContentVariants}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    aria-label="Close modal"
                >
                    <FaTimes className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center text-center mb-6">
                    {React.createElement(tool.icon, { className: "text-6xl text-purple-500 mb-4" })}
                    <h3 className="text-3xl font-bold mb-3">{tool.name}</h3>
                    <p className={`text-sm font-semibold px-3 py-1 rounded-full ${tool.status === 'Available' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'}`}>
                        {tool.status}
                    </p>
                    <p className={`text-xs mt-2 ${dimmedText}`}>
                        Required Plan: <span className="font-bold">{tool.requiredPlan.charAt(0).toUpperCase() + tool.requiredPlan.slice(1)}</span>
                    </p>
                </div>
                <p className={`text-lg leading-relaxed ${dimmedText} text-center mb-6`}>
                    {tool.fullExplanation}
                </p>
                <div className="mt-auto text-center">
                    {tool.status === 'Coming Soon' ? (
                        <Button variant="secondary" disabled>
                            Coming Soon!
                        </Button>
                    ) : showUpgradeButton ? (
                        <Link to="/pricing-page">
                            <Button variant="primary">
                                Upgrade to {tool.requiredPlan.charAt(0).toUpperCase() + tool.requiredPlan.slice(1)} Plan
                            </Button>
                        </Link>
                    ) : (
                        <Button onClick={handleLaunchTool} variant="primary">
                            Launch Tool
                        </Button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};


function ToolsOverviewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, userProfile, authReady } = useAuth();
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const sidebarRef = useRef(null);
    const [currentToolCategoryView, setCurrentToolCategoryView] = useState('platform');
    const [showToolDetailModal, setShowToolDetailModal] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);

    const hasAccess = useCallback((toolRequiredPlan) => {
        if (userProfile?.is_admin) {
            return true;
        }

        if (!userProfile?.membership) {
            return toolRequiredPlan === 'free';
        }

        const userPlanLevel = planHierarchy[userProfile.membership];
        const requiredPlanLevel = planHierarchy[toolRequiredPlan];

        return userPlanLevel >= requiredPlanLevel;
    }, [userProfile]);

    const userDisplayData = {
        name: userProfile?.name || user?.email?.split('@')[0] || "Guest User",
        uid: user?.uid || "Not Authenticated",
        membershipStatus: userProfile?.membership || 'free',
        role: userProfile?.is_admin ? 'admin' : 'user'
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (location.hash && authReady) {
            const id = location.hash.replace('#', '');
            const validCategories = ['chip', 'pcb', 'platform'];
            if (validCategories.includes(id)) {
                setCurrentToolCategoryView(id);
            }
        }
    }, [location.hash, authReady]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (window.innerWidth < 768 && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                 setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        if (!auth) {
            console.error("Firebase Auth not available to logout.");
            return;
        }
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            navigate('/auth');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const handleToolCategoryNavigation = (category) => {
        setCurrentToolCategoryView(category);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
        navigate(`/tools-overview#${category}`, { replace: true });
    };

    const handleOpenToolDetail = (tool) => {
        setSelectedTool(tool);
        setShowToolDetailModal(true);
    };

    const handleCloseToolDetail = () => {
        setShowToolDetailModal(false);
        setSelectedTool(null);
    };

    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    const filteredTools = allTools.filter(tool => tool.category === currentToolCategoryView);

    return (
        <div className={`min-h-screen font-inter antialiased overflow-x-hidden ${mainBg} ${textColor} flex`}>
            <style jsx="true">{`
                :root {
                    --card-bg-dark: #1a1a23;
                    --card-border-dark: #333345;
                    --hover-card-bg-dark: #24242e;
                    --hover-card-border-dark: #a78bfa;
                    --card-bg-light: #ffffff;
                    --card-border-light: #e2e8f0;
                    --hover-card-bg-light: #f5f5f5;
                    --hover-card-border-light: #8a2be2;
                    --coming-soon-bg-dark: rgba(0, 0, 0, 0.7);
                    --coming-soon-bg-light: rgba(255, 255, 255, 0.8);
                    --coming-soon-text-dark: #e0e0e0;
                    --coming-soon-text-light: #1a1a1a;
                    --access-button-bg: #a78bfa;
                    --access-button-hover-bg: #8b5cf6;
                    --access-button-disabled-bg: #4b5563;
                }
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: ${mainBg.replace('bg-', '#').replace('0a0a0f', '0a0a0f').replace('gray-50', 'f9fafb')};
                    color: ${textColor.replace('text-', '#').replace('white', 'ffffff').replace('gray-900', '1a1a1a')};
                }
                .text-highlight-gradient {
                    background: linear-gradient(90deg, #b34bff, #ff4aff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    color: transparent;
                }
                .btn-gradient {
                    background: linear-gradient(90deg, #8a2be2, #e032e0);
                    transition: all 0.3s ease;
                }
                .btn-gradient:hover {
                    background: linear-gradient(90deg, #a740ff, #ff4cff);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
                }

                .tool-card {
                    background-color: ${theme === 'dark' ? 'var(--card-bg-dark)' : 'var(--card-bg-light)'};
                    border: 1px solid ${theme === 'dark' ? 'var(--card-border-dark)' : 'var(--card-border-light)'};
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    transition: all 0.3s ease-in-out;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                }
                .tool-card:hover {
                    background-color: ${theme === 'dark' ? 'var(--hover-card-bg-dark)' : 'var(--hover-card-bg-light)'};
                    border-color: ${theme === 'dark' ? 'var(--hover-card-border-dark)' : 'var(--hover-card-border-light)'};
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }
                .tool-card.disabled {
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .tool-card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)'};
                    color: ${theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.75rem;
                    font-weight: bold;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    text-align: center;
                    font-size: 1.25rem;
                    flex-direction: column;
                }
                .tool-card:hover .tool-card-overlay {
                    opacity: 1;
                    pointer-events: auto;
                }

                .access-button {
                    background-color: var(--access-button-bg);
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                    width: 100%;
                    margin-top: auto;
                }
                .access-button:hover {
                    background-color: var(--access-button-hover-bg);
                    transform: translateY(-2px);
                }
                .access-button:disabled {
                    background-color: var(--access-button-disabled-bg);
                    cursor: not-allowed;
                    opacity: 0.5;
                }
                .sidebar-button {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 1.125rem;
                    font-weight: 500;
                    width: 100%;
                    text-align: left;
                    transition: background-color 0.2s ease, color 0.2s ease;
                }
                .sidebar-button.active {
                    background: linear-gradient(90deg, #8a2be2, #e032e0);
                    color: white;
                }
                .sidebar-button:not(.active):hover {
                    background-color: ${theme === 'dark' ? '#4a5568' : '#edf2f7'};
                    color: ${theme === 'dark' ? '#ffffff' : '#1a202c'};
                }
                .ai-assistant-fab {
                    background: linear-gradient(135deg, #a78bfa, #bb37a9);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3), 0 0 20px rgba(179,75,255,0.4);
                    animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
                    display: flex;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-radius: 9999px;
                    font-size: 1.25rem;
                }
                .ai-assistant-fab:hover {
                    transform: scale(1.08);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 30px rgba(179,75,255,0.6);
                }
                .ai-assistant-fab .fab-icon {
                    font-size: 1.5rem;
                    margin-right: 0.5rem;
                }
                .ai-assistant-fab .fab-text {
                    font-weight: 600;
                }
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 5px 20px rgba(0,0,0,0.4), 0 0 30px rgba(179,75,255,0.6);
                    }
                }
            `}</style>
            
            <motion.header
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center ${isHeaderScrolled || isSidebarOpen ? (theme === 'dark' ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200') : 'bg-transparent'}`}
            >
                <div className="flex items-center space-x-5">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`text-2xl focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'} p-2 rounded-md hover:bg-gray-700 md:hidden`}
                        aria-label="Toggle sidebar"
                    >
                        <FaBars />
                    </button>
                    <BackButton theme={theme} />
                    <Link to="/" className={`flex items-center text-2xl font-bold ${textColor}`}>
                        <span className="text-highlight-gradient">SILICON AI</span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${dimmedText}`}>TECHNOLOGIES</span>
                        <svg className={`w-8 h-8 ml-2 text-highlight-gradient`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                    </Link>

                </div>
                <div className="flex items-center space-x-4">
                    {authReady && userProfile && (
                        <div className={`flex items-center p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} `}>
                            <FaUserCircle className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mr-2`} />
                            <span className={`text-sm font-medium ${textColor} mr-2 hidden sm:inline-block`}>
                                {userProfile.name || "Guest User"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${userProfile.membership === 'free' ? 'bg-blue-600 text-blue-100' : 'bg-green-600 text-green-100'} hidden sm:inline-block`}>
                                {userProfile.membership ? userProfile.membership.charAt(0).toUpperCase() + userProfile.membership.slice(1) : '...'}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200 focus:outline-none`}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200 focus:outline-none`}
                            aria-label="Open menu"
                        >
                            <FaEllipsisV className="text-xl" />
                        </button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`absolute top-full right-0 mt-2 w-56 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl py-2 z-30`}
                                >
                                    <div className={`px-4 py-2 ${dimmedText} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} text-sm truncate`}>
                                        {userProfile?.email || "Guest User"}
                                    </div>
                                    <Link to="/Dashboard" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaHome className="mr-3" /> Dashboard
                                    </Link>
                                    <Link to="/manage-profile" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaUserCircle className="mr-3" /> Profile
                                    </Link>
                                    <Link to="/pricing-page" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaMoneyBillWave className="mr-3" /> Membership Plan
                                    </Link>
                                    <Link to="/contact" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaQuestionCircle className="mr-3" /> Get Support
                                    </Link>
                                    {user && userProfile?.isAdmin && (
                                        <Link to="/admin-users" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                            <FaShieldAlt className="mr-3" /> Admin Panel
                                        </Link>
                                    )}
                                    {user && (
                                        <button onClick={handleLogout} className={`flex items-center w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} transition-colors duration-200`}>
                                            <FaSignOutAlt className="mr-3" /> Logout
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.header>

            {/* Sidebar / Left Navigation */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.aside
                        ref={sidebarRef}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={sidebarVariants}
                        className={`fixed top-0 left-0 h-full w-64 z-40 p-6 pt-28 shadow-xl ${theme === 'dark' ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'} md:translate-x-0`}
                    >
                        <h3 className={`text-xl font-bold mb-4 text-highlight-gradient`}>Tool Categories</h3>
                        <nav className="mb-8 space-y-2">
                            <li className="list-none">
                                <button
                                    onClick={() => handleToolCategoryNavigation('chip')}
                                    className={`sidebar-button ${currentToolCategoryView === 'chip' ? 'active' : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100')}`}
                                >
                                    <FaMicrochip className="mr-4 text-xl" /> CHIP Tools
                                </button>
                            </li>
                            <li className="list-none">
                                <button
                                    onClick={() => handleToolCategoryNavigation('pcb')}
                                    className={`sidebar-button ${currentToolCategoryView === 'pcb' ? 'active' : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100')}`}
                                >
                                    <FaVectorSquare className="mr-4 text-xl" /> PCB Tools
                                </button>
                            </li>
                            <li className="list-none">
                                <button
                                    onClick={() => handleToolCategoryNavigation('platform')}
                                    className={`sidebar-button ${currentToolCategoryView === 'platform' ? 'active' : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100')}`}
                                >
                                    <FaLaptopCode className="mr-4 text-xl" /> Platform Tools
                                </button>
                            </li>
                        </nav>

                        <h3 className={`text-xl font-bold mb-4 text-highlight-gradient`}>Navigation</h3>
                        <nav className="space-y-2">
                             <li className="list-none">
                                <Link to="/Dashboard" className={`sidebar-button ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                                    <FaHome className="mr-4 text-xl" /> HOME
                                </Link>
                            </li>
                            <li className="list-none">
                                <Link to="/project-management" className={`sidebar-button ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                                    <FaCog className="mr-4 text-xl" /> Your Projects
                                </Link>
                            </li>
                            <li className="list-none">
                                <Link to="/learning/tutorials" className={`sidebar-button ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                                    <FaGraduationCap className="mr-4 text-xl" /> Learning
                                </Link>
                            </li>
                            <li className="list-none">
                                <Link to="/contact" className={`sidebar-button ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                                    <FaQuestionCircle className="mr-4 text-xl" /> Get Support
                                </Link>
                            </li>
                            {userProfile?.isAdmin && (
                                <li className="list-none">
                                    <Link to="/admin-users" className={`sidebar-button ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                                        <FaShieldAlt className="mr-4 text-xl" /> Admin Panel
                                    </Link>
                                </li>
                            )}
                        </nav>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-white md:hidden"
                            aria-label="Close sidebar"
                        >
                            <FaTimes />
                        </button>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div
                className={`flex flex-col flex-grow pt-28 px-4 pb-8 md:px-8 ${mainBg} transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}
            >
                <div id="main-tool-content" className="relative flex-grow rounded-xl themed-bg-card shadow-lg border p-6 md:p-8" style={{ minHeight: '600px' }}>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={sectionTitleVariants}
                        className={`text-4xl md:text-5xl font-extrabold mb-12 text-highlight-gradient text-center`}
                    >
                        {currentToolCategoryView === 'chip' && 'CHIP Design Tools'}
                        {currentToolCategoryView === 'pcb' && 'PCB Design Tools'}
                        {currentToolCategoryView === 'platform' && 'Platform Tools & Utilities'}
                    </motion.h1>

                    {/* User Subscription Status Display */}
                    {authReady && userProfile && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-10 p-5 rounded-lg shadow-md flex items-center justify-between flex-wrap gap-4 ${
                                ['premium', 'pro', 'standard', 'enterprise'].includes(userProfile.membership)
                                    ? 'bg-green-700/20 text-green-300'
                                    : 'bg-blue-700/20 text-blue-300'
                            }`}
                        >
                            <p className="text-lg font-semibold flex items-center">
                                <FaCheckCircle className="mr-3 text-2xl" />
                                You are currently a <span className={`ml-2 text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    {userProfile.membership ? userProfile.membership.charAt(0).toUpperCase() + userProfile.membership.slice(1) : 'Loading...'} Member
                                </span>
                            </p>
                            {(userProfile.membership === 'free' || userProfile.membership === 'standard' || userProfile.membership === 'pro' || userProfile.membership === 'premium') && (
                                <Link to="/pricing-page" className="btn-gradient text-white py-2 px-6 rounded-full font-semibold shadow-md">
                                    Upgrade Plan <FaArrowRight className="ml-2 inline-block" />
                                </Link>
                            )}
                            {userProfile.membership === 'enterprise' && (
                                <Link to="/your-membership" className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} py-2 px-6 rounded-full font-semibold shadow-md`}>
                                    Manage Membership
                                </Link>
                            )}
                        </motion.div>
                    )}

                    {/* Render the selected tool category content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentToolCategoryView}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={contentTransitionVariants}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredTools.map((tool) => {
                                const isAccessible = hasAccess(tool.requiredPlan);
                                const isDisabled = tool.status === 'Coming Soon' || !isAccessible;

                                return (
                                    <motion.div
                                        key={tool.id}
                                        variants={toolCardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        whileHover="hover"
                                        whileTap="tap"
                                        className={`tool-card ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => handleOpenToolDetail(tool)}
                                    >
                                        {/* Overlay for Coming Soon / Locked */}
                                        {isDisabled && (
                                            <div className="tool-card-overlay">
                                                {tool.status === 'Coming Soon' ? (
                                                    <>
                                                        <FaClock className="text-4xl mb-2" />
                                                        <span>Coming Soon!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaLock className="text-4xl mb-2" />
                                                        <span>Locked - Upgrade Plan</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Tool Content */}
                                        {React.createElement(tool.icon, { className: "text-5xl text-purple-500 mb-4" })}
                                        <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
                                        <p className={`mb-4 text-sm ${dimmedText}`}>
                                            {tool.shortDescription}
                                        </p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            tool.status === 'Available' ? 'bg-green-600 text-green-100' : 'bg-yellow-600 text-yellow-100'
                                        }`}>
                                            {tool.status}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer (One-line) */}
                <footer className={`w-full text-center py-6 ${theme === 'dark' ? 'text-gray-400 bg-gray-900' : 'bg-gray-700 bg-gray-100'} mt-8 rounded-md`}>
                    <p>&copy; {new Date().getFullYear()} SILICON AI Technologies. All rights reserved.</p>
                </footer>
            </div>

            {/* Tool Detail Modal (Conditionally Rendered) */}
            <AnimatePresence>
                {showToolDetailModal && (
                    <ToolDetailModal
                        theme={theme}
                        tool={selectedTool}
                        onClose={handleCloseToolDetail}
                        hasAccess={hasAccess}
                        userMembershipStatus={userProfile?.membership} // Pass userProfile.membership
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default ToolsOverviewPage;
