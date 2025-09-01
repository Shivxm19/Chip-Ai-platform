/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-undef */
// src/pages/PricingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaBars, FaCog, FaSignOutAlt, FaUserCircle, FaMoneyBillWave, FaHome, FaTimes,
    FaSun, FaMoon, FaArrowLeft, FaEllipsisV, FaCheckCircle, FaStar, FaCrown, FaBuilding, FaQuestionCircle,
    FaShieldAlt, FaTools, FaGraduationCap, FaComments // Added for admin panel link
} from 'react-icons/fa';

// CORRECTED IMPORTS:
// Import core Firebase Auth instance and SDK functions directly from firebaseConfig
import {
    auth,
    onAuthStateChanged,
    signOut, // signOut is now directly from firebaseConfig
} from '../firebaseconfig'; // Corrected path to firebaseConfig.js

// Import custom user profile functions from authService
import { getMyProfile } from '../services/authService'; // getMyProfile is from authService

// Import reusable UI components
import Button from '../components/UI/Uibutton';
import BackButton from '../components/BackButton';


// --- Pricing Plan Data ---
const pricingPlans = [
    {
        id: 'free',
        name: 'Free Tier',
        price: '$0/month',
        description: 'Perfect for hobbyists and learning.',
        features: [
            'Basic RTL Editor',
            'Basic Schematic Editor',
            'Cloud Storage (1GB)',
            'Limited AI Assistant uses',
            'Community Support'
        ],
        icon: FaCheckCircle,
        color: 'text-green-500'
    },
    {
        id: 'standard',
        name: 'Standard Plan',
        price: '$29/month',
        description: 'For independent engineers and small projects.',
        features: [
            'All Free Tier features',
            'Advanced Logic Synthesis',
            'Full PCB Layout Designer',
            'Cloud Storage (50GB)',
            'Enhanced AI Assistant',
            'Version Control',
            'Email Support'
        ],
        icon: FaStar,
        color: 'text-blue-500'
    },
    {
        id: 'pro',
        name: 'Pro Plan',
        price: '$99/month',
        description: 'Designed for professionals and growing teams.',
        features: [
            'All Standard Plan features',
            'Formal Verification',
            'Signal Integrity Analysis',
            'Cloud Storage (Unlimited)',
            'Priority AI Assistant',
            'Team Collaboration Hub',
            'Dedicated Chat Support'
        ],
        icon: FaCrown,
        color: 'text-purple-500'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'Tailored solutions for large organizations.',
        features: [
            'All Pro Plan features',
            'Physical Design Suite',
            'Design for Test (DFT)',
            'On-premise deployment options',
            'Custom AI Models',
            '24/7 Premium Support',
            'Dedicated Account Manager'
        ],
        icon: FaBuilding,
        color: 'text-yellow-500'
    }
];


// --- Framer Motion Variants (Consistent with Dashboard/ToolsOverview) ---
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

const cardVariants = { // Reusable for various cards
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
};


function PricingPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // Added userProfile state
    const [authReady, setAuthReady] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false); // For the three-dot menu
    const menuRef = useRef(null); // For menu close outside click
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false); // For transparent header
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const sidebarRef = useRef(null);


    // User Profile Data (dynamic from Firebase user)
    const userDisplayData = {
        name: userProfile?.name || user?.email?.split('@')[0] || "Guest User", // Use userProfile.name for consistency
        uid: user?.uid || "Not Authenticated",
        membershipStatus: userProfile?.membership || 'free', // Use membership field from backend
        aiUsesLeft: userProfile?.aiUsesLeft !== undefined ? userProfile.aiUsesLeft : 'N/A',
        role: userProfile?.isAdmin ? 'admin' : 'user' // Map isAdmin to role
    };


    // Persist theme to localStorage
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Handle header transparency on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsHeaderScrolled(true);
            } else {
                setIsHeaderScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    // Firebase Auth State Listener & Fetch User Profile
    useEffect(() => {
        // Ensure auth and onAuthStateChanged are available before using them
        if (!auth || !onAuthStateChanged) {
            console.warn("Auth instance or onAuthStateChanged not available on PricingPage.");
            setAuthReady(true);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const profile = await getMyProfile(); // Get profile from authService
                    if (profile) {
                        setUserProfile(profile); // Set the full user profile
                    } else {
                        // Fallback if no profile found in MongoDB (should be rare if register/login works)
                        setUserProfile({ uid: currentUser.uid, email: currentUser.email || 'anonymous', name: currentUser.email?.split('@')[0] || 'Guest User', isAdmin: false, membership: 'free' });
                        console.warn(`PricingPage: No backend user profile found for ${currentUser.uid}. Defaulting to 'free' status.`);
                    }
                } catch (error) {
                    console.error("PricingPage: Error fetching backend user profile:", error);
                    setUserProfile({ uid: currentUser.uid, email: currentUser.email || 'anonymous', name: currentUser.email?.split('@')[0] || 'Guest User', isAdmin: false, membership: 'free' });
                }
            } else {
                console.log("No Firebase user. Consider redirecting to login.");
                setUserProfile(null);
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // Handle Logout
    const handleLogout = async () => {
        if (!auth) {
            console.error("Firebase Auth not available to logout.");
            return;
        }
        try {
            await signOut(auth); // Use signOut from firebaseConfig
            console.log("User logged out successfully.");
            navigate('/login'); // Navigate to login page after logout
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Theme Toggle Function
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };


    // Dynamic background and text colors based on theme
    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`min-h-screen font-inter antialiased overflow-x-hidden ${mainBg} ${textColor} flex`}>
            {/* Custom CSS for Theming and Card Styles */}
            <style jsx="true">{`
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
                .themed-bg-card {
                    background-color: ${theme === 'dark' ? '#1a1a23' : '#ffffff'};
                    border-color: ${theme === 'dark' ? '#333345' : '#e2e8f0'};
                    color: ${theme === 'dark' ? '#e0e0e0' : '#1a1a1a'};
                }
                .themed-bg-card:hover {
                    border-color: ${theme === 'dark' ? '#bb37a9' : '#8a2be2'};
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
                    display: flex; /* Ensure flex for icon and text */
                    align-items: center; /* Vertically align icon and text */
                    padding: 1rem 1.5rem; /* Adjust padding for text */
                    border-radius: 9999px; /* Fully rounded */
                    font-size: 1.25rem; /* Adjust font size */
                }
                .ai-assistant-fab:hover {
                    transform: scale(1.08);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 25px rgba(179,75,255,0.6);
                }
                .ai-assistant-fab .fab-icon {
                    font-size: 1.5rem; /* Adjust icon size within button */
                    margin-right: 0.5rem; /* Space between icon and text */
                }
                .ai-assistant-fab .fab-text {
                    font-weight: 600; /* Semi-bold text */
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
                /* Pricing Card Specific Styles */
                .pricing-card {
                    transition: all 0.3s ease-in-out;
                    border: 1px solid;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }
                .pricing-card.dark-theme {
                    background-color: #1a1a23;
                    border-color: #333345;
                    color: #e0e0e0;
                }
                .pricing-card.light-theme {
                    background-color: #ffffff;
                    border-color: #e2e8f0;
                    color: #1a1a1a;
                }
                .pricing-card.current-plan {
                    border-width: 3px;
                    border-color: #bb37a9; /* Highlight color */
                    box-shadow: 0 8px 25px rgba(179, 75, 255, 0.4);
                    transform: scale(1.03);
                }
                .pricing-card:hover:not(.current-plan) {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
                }
                .pricing-card .icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                .pricing-card .price {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                }
                .pricing-card .feature-list {
                    list-style: none;
                    padding: 0;
                    margin-bottom: 2rem;
                    text-align: left;
                    width: 100%;
                }
                .pricing-card .feature-list li {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                    color: ${theme === 'dark' ? '#bbb' : '#4a4a4a'};
                }
                .pricing-card .feature-list li svg {
                    margin-right: 0.75rem;
                    color: #6ee7b7; /* Green checkmark */
                }
            `}</style>

            {/* Header (Consistent with Dashboard) */}
            <motion.header
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center ${isHeaderScrolled ? (theme === 'dark' ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200') : 'bg-transparent'}`}
            >
                {/* Left Section: Hamburger (mobile), Company Logo, Back Button */}
                <div className="flex items-center space-x-5">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`text-2xl focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'} p-2 rounded-md hover:bg-gray-700 md:hidden`}
                        aria-label="Toggle sidebar"
                    >
                        <FaBars />
                    </button>
                    <BackButton theme={theme} />
                    <Link to="/" className={`flex items-center text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <span className="text-highlight-gradient">SILICON AI</span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>TECHNOLOGIES</span>
                        <svg className={`w-8 h-8 ml-2 text-highlight-gradient`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                    </Link>
                </div>

                {/* Right Section: Profile Avatar, Three-Dot Menu */}
                <div className="flex items-center space-x-4">
                     {/* Profile Avatar (without subscription/AI token info) */}
                    {authReady && user && (
                        <div className={`flex items-center p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} `}>
                            <FaUserCircle className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mr-2`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} hidden sm:inline-block`}>
                                {userDisplayData.name}
                            </span>
                        </div>
                    )}
                    {/* Three-dot menu button */}
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
                                    <div className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} text-sm truncate`}>
                                        {userDisplayData.name}
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
                                        <FaQuestionCircle className="mr-3" /> Contact Support
                                    </Link>
                                    {userProfile?.role === 'owner' && (
                                        <Link to="/admin-users" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                            <FaShieldAlt className="mr-3" /> Admin Panel
                                        </Link>
                                    )}
                                    <button
                                        onClick={toggleTheme}
                                        className={`flex items-center w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}
                                    >
                                        {theme === 'dark' ? <FaSun className="mr-3" /> : <FaMoon className="mr-3" />} Toggle Theme
                                    </button>
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <motion.h1
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl font-extrabold text-center text-highlight-gradient mb-8"
                >
                    Choose Your Plan
                </motion.h1>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                    {/* Free Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                        className={`p-8 rounded-xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col items-center text-center`}
                    >
                        <h2 className="text-3xl font-bold mb-4">Free</h2>
                        <p className="text-5xl font-extrabold text-highlight-gradient mb-6">₹0</p>
                        <p className={`text-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>For hobbyists and beginners</p>
                        <ul className="text-left w-full mb-8 space-y-2">
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Basic PCB Schematic Editor
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> RTL Editor
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Project Dashboard
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Cloud Storage (Limited)
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaTimesCircle className="text-red-500 mr-2" /> No AI Tools
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaTimesCircle className="text-red-500 mr-2" /> Limited Support
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSelectPlan('free')}
                            variant={userProfile?.membershipStatus === 'free' ? 'secondary' : 'primary'}
                            disabled={userProfile?.membershipStatus === 'free'}
                            className="w-full"
                        >
                            {userProfile?.membershipStatus === 'free' ? 'Current Plan' : 'Select Free'}
                        </Button>
                    </motion.div>

                    {/* Standard Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                        className={`p-8 rounded-xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-purple-500' : 'bg-white border-purple-500'} flex flex-col items-center text-center relative overflow-hidden`}
                    >
                        <span className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Popular</span>
                        <h2 className="text-3xl font-bold mb-4">Standard</h2>
                        <p className="text-5xl font-extrabold text-highlight-gradient mb-6">₹999<span className="text-xl font-normal">/month</span></p>
                        <p className={`text-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>For serious hobbyists & small teams</p>
                        <ul className="text-left w-full mb-8 space-y-2">
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> All Free features
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> PCB Layout Editor
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Logic Simulator
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Gerber Generator & Viewer
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> BOM Generator
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI Design Assistant (General)**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI HDL Code Editor**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Priority Support
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSelectPlan('standard')}
                            variant={userProfile?.membershipStatus === 'standard' ? 'secondary' : 'primary'}
                            disabled={userProfile?.membershipStatus === 'standard'}
                            className="w-full"
                        >
                            {userProfile?.membershipStatus === 'standard' ? 'Current Plan' : 'Select Standard'}
                        </Button>
                    </motion.div>

                    {/* Pro Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                        className={`p-8 rounded-xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col items-center text-center`}
                    >
                        <h2 className="text-3xl font-bold mb-4">Pro</h2>
                        <p className="text-5xl font-extrabold text-highlight-gradient mb-6">₹1999<span className="text-xl font-normal">/month</span></p>
                        <p className={`text-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>For professional designers & growing teams</p>
                        <ul className="text-left w-full mb-8 space-y-2">
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> All Standard features
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI-Powered DRC (Chip & PCB)**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI-Driven Test Pattern Generation**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Advanced Collaboration Tools
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Dedicated Support
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> Increased Storage & Compute
                            </li>
                        </ul>
                        <Button
                            onClick={() => handleSelectPlan('pro')}
                            variant={userProfile?.membershipStatus === 'pro' ? 'secondary' : 'primary'}
                            disabled={userProfile?.membershipStatus === 'pro'}
                            className="w-full"
                        >
                            {userProfile?.membershipStatus === 'pro' ? 'Current Plan' : 'Select Pro'}
                        </Button>
                    </motion.div>
                </div>

                {/* Enterprise Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                    className={`mt-12 p-8 rounded-xl shadow-2xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-6xl text-center`}
                >
                    <h2 className="text-3xl font-bold mb-4 text-highlight-gradient">Enterprise Solutions</h2>
                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                        For large organizations requiring custom features, dedicated support, and on-premise deployment options.
                        Includes all Pro features plus:
                    </p>
                    <ul className="text-left w-full mb-8 space-y-2 inline-block">
                        <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI-Optimized Placement & Routing (PCB)**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI-Assisted Synthesis & Physical Design (Chip)**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI-Powered Predictive Analytics (Yield/Reliability)**
                            </li>
                            <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCheckCircle className="text-green-500 mr-2" /> **AI System-Level Co-simulation**
                            </li>
                        <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <FaCheckCircle className="text-green-500 mr-2" /> Dedicated Infrastructure & SLAs
                        </li>
                        <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <FaCheckCircle className="text-green-500 mr-2" /> On-Premise/Hybrid Deployment
                        </li>
                        <li className={`flex items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            <FaCheckCircle className="text-green-500 mr-2" /> Custom Tool Integrations
                        </li>
                    </ul>
                    <Button
                        onClick={() => navigate('/contact')}
                        variant="primary"
                        className="w-full md:w-auto px-10 py-3"
                    >
                        Contact Sales <FaArrowRight className="ml-2 inline-block" />
                    </Button>
                </motion.div>
            </main>

            {/* Floating AI Assistant Button */}
            <motion.button
                className="ai-assistant-fab fixed bottom-8 right-8 text-white shadow-lg cursor-pointer z-50"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.8 }}
                onClick={() => console.log("AI Assistant Chat coming soon!")}
                aria-label="Open AI Assistant"
            >
                <FaComments className="fab-icon" />
                <span className="fab-text">AI Assistant</span>
            </motion.button>

            {/* Footer */}
            <footer className={`w-full text-center py-6 ${theme === 'dark' ? 'text-gray-400 bg-gray-900' : 'text-gray-700 bg-gray-100'} mt-8 rounded-md`}>
                <p>&copy; {new Date().getFullYear()} SILICON AI Technologies. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default PricingPage;
