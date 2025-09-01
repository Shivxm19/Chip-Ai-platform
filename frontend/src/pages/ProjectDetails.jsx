// src/pages/ProjectDetailPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    FaBars, FaCog, FaSignOutAlt, FaUserCircle, FaMoon, FaSun,
    FaArrowLeft, FaMoneyBillWave, FaTools, FaCogs, FaSpinner,
    FaUsers, FaSave, FaExclamationCircle, FaCheckCircle, FaProjectDiagram // Project-specific icon
} from 'react-icons/fa';

import BackButton from '../components/BackButton';
import {
    auth,
    db,
    appIdentifier,
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken,
    getUserProfile,
    doc,
    onSnapshot
} from '../FirebaseServices';

function ProjectDetailPage() {
    const navigate = useNavigate();
    const { projectId } = useParams(); // Get project ID from URL
    const [user, setUser] = useState(null);
    const [userSubscriptionStatus, setUserSubscriptionStatus] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectContent, setProjectContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    // User Profile Data
    const userProfileDisplay = {
        name: user?.displayName || user?.email?.split('@')[0] || "Guest User",
        uid: user?.uid || "Not Authenticated",
    };

    // --- Framer Motion Variants (Consistent) ---
    const headerVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const sectionTitleVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.2 } }
    };

    const contentVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
    };
    // --- End Framer Motion Variants ---

    // Theme persistence
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Header scroll transparency
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

    // Firebase Auth State Listener
    useEffect(() => {
        if (!auth) {
            console.warn("Auth instance not available for state listener on ProjectDetailPage.");
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                try {
                    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("ProjectDetailPage: Anonymous/token sign-in error:", error);
                    setError("Failed to authenticate. Please try again.");
                }
            } else {
                const profile = await getUserProfile(currentUser.uid);
                if (profile) {
                    setUserSubscriptionStatus(profile.subscriptionStatus || 'free');
                } else {
                    setUserSubscriptionStatus('free');
                }
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, [navigate]);

    // Fetch project details in real-time
    useEffect(() => {
        if (!authReady || !db || !projectId) {
            return;
        }

        setLoading(true);
        setError(null);
        setProject(null);
        setProjectContent('');

        const projectDocRef = doc(db, `artifacts/${appIdentifier}/public/projects`, projectId);

        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Check if the current user is authorized to view this project
                if (user && (data.createdBy === user.uid || (data.collaborators && data.collaborators.includes(user.uid)))) {
                    setProject({ id: docSnap.id, ...data });
                    try {
                        // Attempt to parse content if it's stored as JSON string
                        const parsedContent = JSON.parse(data.content);
                        setProjectContent(JSON.stringify(parsedContent, null, 2)); // Pretty print for editor
                    } catch (e) {
                        setProjectContent(data.content || ''); // Use raw content if not valid JSON
                        console.warn("Project content is not valid JSON, displaying as plain text.");
                    }
                    setLoading(false);
                } else if (user) {
                    setError("You do not have access to this project.");
                    setLoading(false);
                } else {
                    // If user is not authenticated yet, wait for authReady
                    // This scenario is handled by the authReady check at the top of the useEffect
                }
            } else {
                setError("Project not found.");
                setLoading(false);
            }
        }, (err) => {
            console.error("Error fetching project details:", err);
            setError("Failed to load project details.");
            setLoading(false);
        });

        return () => unsubscribe(); // Clean up listener on component unmount or dependency change
    }, [authReady, db, projectId, user]); // Include user in dependencies to re-run on auth state change


    // Handle saving project content
    const handleSaveProjectContent = async () => {
        if (!project || !user || (!project.collaborators.includes(user.uid) && project.createdBy !== user.uid)) {
            setSaveMessage({ type: 'error', text: 'You do not have permission to edit this project.' });
            return;
        }

        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            // Attempt to parse/stringify content to ensure it's valid JSON if intended
            const contentToSave = projectContent; // We're allowing any text for now for flexibility
            await updateDoc(doc(db, `artifacts/${appIdentifier}/public/projects`, projectId), {
                content: contentToSave
            });
            setSaveMessage({ type: 'success', text: 'Project content saved!' });
        } catch (err) {
            console.error("Error saving project content:", err);
            setSaveMessage({ type: 'error', text: `Failed to save content: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };


    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
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
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };


    // Dynamic colors based on theme
    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${mainBg}`}>
                <FaSpinner className="animate-spin text-5xl text-highlight-gradient" />
                <p className="text-xl ml-4">Loading project...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${mainBg} text-center p-4`}>
                <FaExclamationCircle className="text-red-500 text-6xl mb-4" />
                <h2 className="text-2xl font-bold mb-4">{error}</h2>
                <p className={`${dimmedText} mb-6`}>
                    Please ensure you have access to this project or that the link is correct.
                </p>
                {!user && (
                    <button onClick={() => navigate('/login')} className="btn-gradient py-2 px-6 rounded-md text-white font-semibold">
                        Sign In
                    </button>
                )}
                {user && (
                    <Link to="/project-management-page" className="btn-gradient py-2 px-6 rounded-md text-white font-semibold mt-4">
                        Go to Project List
                    </Link>
                )}
            </div>
        );
    }

    if (!project) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${mainBg}`}>
                <p className="text-xl">Project data not available. This should not happen after loading completes without error.</p>
            </div>
        );
    }

    const isCreatorOrCollaborator = user && (project.createdBy === user.uid || (project.collaborators && project.collaborators.includes(user.uid)));

    return (
        <div className={`min-h-screen font-inter antialiased overflow-x-hidden ${mainBg} ${textColor}`}>
            {/* Custom CSS for Theming (matching dashboard) */}
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
                 .input-field {
                    background-color: ${theme === 'dark' ? '#2d3748' : '#edf2f7'};
                    border: 1px solid ${theme === 'dark' ? '#4a5568' : '#cbd5e0'};
                    color: ${theme === 'dark' ? '#e0e0e0' : '#1a202c'};
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-field:focus {
                    border-color: #bb37a9;
                }
            `}</style>

            {/* Header (Consistent with Dashboard) */}
            <motion.header
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center ${isHeaderScrolled ? (theme === 'dark' ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200') : 'bg-transparent'}`}
            >
                {/* Left Section: Back Button, Company Logo */}
                <div className="flex items-center space-x-6">
                    <BackButton theme={theme} />
                    <Link to="/" className={`flex items-center text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <span className="text-highlight-gradient">SILICON AI</span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>TECHNOLOGIES</span>
                        <svg className={`w-8 h-8 ml-2 text-highlight-gradient`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                    </Link>
                </div>

                {/* Right Section: Profile Logo + Plan, Theme Toggle, Menu */}
                <div className="flex items-center space-x-4">
                    {authReady && user && (
                        <div className={`flex items-center p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} `}>
                            <FaUserCircle className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mr-2`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mr-2 hidden sm:inline-block`}>
                                {userProfileDisplay.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${userSubscriptionStatus === 'free' ? 'bg-blue-600 text-blue-100' : 'bg-green-600 text-green-100'} hidden sm:inline-block`}>
                                {userSubscriptionStatus ? userSubscriptionStatus.charAt(0).toUpperCase() + userSubscriptionStatus.slice(1) : '...'}
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
                            className={`text-2xl focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
                            aria-label="Open menu"
                        >
                            <FaBars />
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
                                        {userProfileDisplay.name}
                                    </div>
                                    <Link to="/dashboard" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaCogs className="mr-3" /> Dashboard
                                    </Link>
                                    <Link to="/tools-overview" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaTools className="mr-3" /> All Tools
                                    </Link>
                                    <Link to="/manage-profile" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaUserCircle className="mr-3" /> Manage Profile
                                    </Link>
                                    <Link to="/pricing" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaMoneyBillWave className="mr-3" /> Membership Plan
                                    </Link>
                                    <Link to="/contact" className={`flex items-center px-4 py-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'} transition-colors duration-200`}>
                                        <FaCog className="mr-3" /> Contact Support
                                    </Link>
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

            <main className={`container mx-auto px-4 py-8 md:py-12 pt-28 ${mainBg}`}>
                <motion.h1
                    initial="hidden"
                    animate="visible"
                    variants={sectionTitleVariants}
                    className={`text-4xl md:text-5xl font-extrabold mb-12 text-highlight-gradient text-center`}
                >
                    Project: {project.name}
                </motion.h1>

                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={contentVariants}
                    className={`themed-bg-card rounded-xl p-6 md:p-8 shadow-lg border mb-8`}
                >
                    <div className="mb-6">
                        <p className={`text-lg mb-2 ${textColor}`}>
                            <span className="font-semibold">Description:</span> {project.description || 'No description.'}
                        </p>
                        <p className={`text-sm ${dimmedText}`}>
                            Created By: {project.createdBy === user?.uid ? 'You' : project.createdBy} at {project.createdAt?.seconds ? new Date(project.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                        </p>
                        <div className="flex items-center mt-2">
                            <FaUsers className={`mr-2 ${dimmedText}`} />
                            <span className={`${dimmedText}`}>Collaborators:</span>
                            <ul className="flex flex-wrap gap-x-3 ml-2 text-sm">
                                {project.collaborators && project.collaborators.length > 0 ? (
                                    project.collaborators.map((uid, index) => (
                                        <li key={uid} className={textColor}>
                                            {uid === user?.uid ? 'You' : uid.substring(0, 8)} {/* Displaying first 8 chars of UID for brevity */}
                                            {index < project.collaborators.length - 1 ? ',' : ''}
                                        </li>
                                    ))
                                ) : (
                                    <li className={dimmedText}>None</li>
                                )}
                            </ul>
                        </div>
                        <p className={`text-sm mt-4 ${dimmedText}`}>
                            Your User ID: <span className="font-mono text-xs break-all">{user?.uid || 'Not Authenticated'}</span>
                        </p>
                    </div>

                    <h2 className={`text-2xl font-extrabold mb-4 ${textColor} flex items-center`}>
                        <FaProjectDiagram className="mr-3 text-highlight-gradient" /> Project Content (Editable)
                    </h2>
                    <textarea
                        value={projectContent}
                        onChange={(e) => setProjectContent(e.target.value)}
                        className="input-field w-full h-96 font-mono text-sm resize-y"
                        placeholder="Edit your project content here..."
                        disabled={!isCreatorOrCollaborator || isSaving}
                    />
                    {saveMessage.text && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-4 p-3 rounded-md flex items-center text-sm ${
                                saveMessage.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'
                            }`}
                        >
                            {saveMessage.type === 'error' ? <FaExclamationCircle className="mr-2" /> : <FaCheckCircle className="mr-2" />}
                            {saveMessage.text}
                        </motion.p>
                    )}
                    {isCreatorOrCollaborator && (
                        <button
                            onClick={handleSaveProjectContent}
                            className="btn-gradient py-2 px-6 rounded-md text-white font-semibold flex items-center justify-center mt-4"
                            disabled={isSaving}
                        >
                            {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                     {!user && (
                        <p className={`mt-4 ${dimmedText} text-center`}>
                            Please <Link to="/login" className="text-highlight-gradient hover:underline">sign in</Link> to view or edit project content.
                        </p>
                    )}
                    {user && !isCreatorOrCollaborator && (
                        <p className={`mt-4 ${dimmedText} text-center`}>
                            You are viewing this project, but only the creator or existing collaborators can make changes.
                        </p>
                    )}
                </motion.div>
            </main>

            {/* Footer (One-line) */}
            <footer className={`w-full text-center py-6 ${theme === 'dark' ? 'text-gray-400 bg-gray-900' : 'text-gray-700 bg-gray-100'} mt-8 rounded-md`}>
                <p>&copy; {new Date().getFullYear()} SILICONAI Technologies. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default ProjectDetailPage;
