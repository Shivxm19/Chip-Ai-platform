/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaTools, FaProjectDiagram, FaUserCircle, FaMoneyBillWave, FaSignOutAlt,
    FaSun, FaMoon, FaBars, FaEllipsisV, FaPlus, FaCloudUploadAlt, FaFileCode, FaMicrochip,
    FaLaptopCode, FaComments, FaChartLine, FaFlask, FaBoxes, FaLightbulb, FaShieldAlt,
    FaQuestionCircle, FaCheckCircle, FaArrowRight, FaClock, FaLock, FaExclamationCircle, 
    FaSpinner, FaGraduationCap, FaTimes
} from 'react-icons/fa';

// Firebase imports
import {
    auth,
    onAuthStateChanged,
    signOut,
    db,
    collection,
    query,
    where,
    getDocs,
    doc,
    deleteDoc,
    orderBy,
    setDoc,
    serverTimestamp,
    addDoc,
} from '../firebaseconfig';
import { getMyProfile } from '../services/authService';

// ===== Animation Variants =====
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  },
  hover: {
    y: -8,
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.4)",
    borderColor: '#bb37a9',
    transition: {
      duration: 0.3
    }
  },
  tap: {
    scale: 0.95
  }
};

const headerVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const sidebarVariants = {
  closed: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
  open: {
    x: '0%',
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 25 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// ===== Main Component =====
function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const sidebarRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projectMessage, setProjectMessage] = useState({ type: '', text: '' });
    
    // Admin access state
    const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
    const [adminCredentials, setAdminCredentials] = useState({
        username: '',
        code: ''
    });
    const [adminLoginError, setAdminLoginError] = useState('');

    // Admin credentials (store these securely in production)
    const ADMIN_ACCESS_CODE = 'Shivxm19';
    const ADMIN_USERNAMES = ['admin', 'superuser'];

    // Theme classes
    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

    // User data
    const userDisplayData = {
        name: userProfile?.name || user?.email?.split('@')[0] || "Guest User",
        uid: user?.uid || "Not Authenticated",
        membershipStatus: userProfile?.membership || 'free',
        aiUsesLeft: userProfile?.aiUsesLeft !== undefined ? userProfile.aiUsesLeft : 'N/A',
        role: userProfile?.isAdmin ? 'admin' : 'user'
    };

    // Display message with animation
    const displayMessage = (msg, type) => {
        setProjectMessage({ type, text: msg });
        setTimeout(() => setProjectMessage({ type: '', text: '' }), 5000);
    };

    // Theme toggle with animation
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            return newTheme;
        });
    }, []);

    // Admin login handlers
    const handleAdminLoginClick = () => {
        setShowAdminLoginModal(true);
        setAdminLoginError('');
        setAdminCredentials({ username: '', code: '' });
    };

    const handleAdminCredentialsChange = (e) => {
        const { name, value } = e.target;
        setAdminCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleAdminLoginSubmit = (e) => {
        e.preventDefault();
        
        if (!ADMIN_USERNAMES.includes(adminCredentials.username.toLowerCase())) {
            setAdminLoginError('Invalid admin username');
            return;
        }
        
        if (adminCredentials.code !== ADMIN_ACCESS_CODE) {
            setAdminLoginError('Invalid access code');
            return;
        }
        
        // Store admin access in localStorage (for demo purposes)
        // In production, use proper session management
        localStorage.setItem('adminAccess', 'true');
        navigate('/admin-panel');
        setShowAdminLoginModal(false);
    };

    // Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const profile = await getMyProfile();
                    setUserProfile(profile || { 
                        uid: currentUser.uid, 
                        email: currentUser.email || 'anonymous', 
                        name: currentUser.email?.split('@')[0] || 'Guest User', 
                        isAdmin: false, 
                        membership: 'free' 
                    });
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    setUserProfile({ 
                        uid: currentUser.uid, 
                        email: currentUser.email || 'anonymous', 
                        name: currentUser.email?.split('@')[0] || 'Guest User', 
                        isAdmin: false, 
                        membership: 'free' 
                    });
                }
            } else {
                setUserProfile(null);
                navigate('/Authpage', { replace: true });
            }
            setAuthReady(true);
        });
        return () => unsubscribe();
    }, [navigate]);

  // REPLACE the userProjectsCollectionRef function:
const userProjectsCollectionRef = useCallback(() => {
  if (!db || !user?.uid) return null;
  return collection(db, 'projects'); // ← Change to 'projects' collection
}, [db, user]);

// UPDATE fetchProjects function:
const fetchProjects = useCallback(async () => {
  if (!user?.uid) {
    setProjects([]);
    setLoadingProjects(false);
    return;
  }
  setLoadingProjects(true);
  try {
    // Query projects where userId matches current user's UID
    const q = query(
      collection(db, 'projects'), 
      where('userId', '==', user.uid),
      orderBy('lastModified', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const projectsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastModified: doc.data().lastModified?.toDate() || new Date()
    }));
    setProjects(projectsList);
    displayMessage(`Fetched ${projectsList.length} projects.`, 'success');
  } catch (error) {
    console.error("Error fetching projects:", error);
    displayMessage(`Failed to fetch projects: ${error.message}`, 'error');
  } finally {
    setLoadingProjects(false);
  }
}, [user?.uid]); // ← Only depend on user.uid

// UPDATE handleCreateNewProject function:
const handleCreateNewProject = async () => {
  if (!user) {
    displayMessage("Please log in to create a project.", 'error');
    return;
  }
  const projectName = prompt("Enter new project name:");
  if (projectName?.trim()) {
    const trimmedName = projectName.trim();
    if (projects.some(p => p.name === trimmedName)) {
      displayMessage("Project with this name already exists.", 'error');
      return;
    }
    setLoadingProjects(true);
    try {
      const newProjectData = {
        name: trimmedName,
        userId: user.uid, // ← CRITICAL: Add userId field
        userEmail: user.email,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
        files: [{ id: 'main', name: 'main.sv', content: `// Project: ${trimmedName}\n// Main design file\n` }],
        type: 'RTL'
      };
      
      // Add to 'projects' collection instead of 'users/uid/rtl_projects'
      const docRef = await addDoc(collection(db, 'projects'), newProjectData);
      
      displayMessage(`Project "${trimmedName}" created!`, 'success');
      fetchProjects();
      navigate(`/tools/rtl-editor?project=${docRef.id}`); // ← Use docRef.id instead of project name
    } catch (error) {
      console.error("Error creating project:", error);
      displayMessage(`Failed to create project: ${error.message}`, 'error');
    } finally {
      setLoadingProjects(false);
    }
  }
};

// UPDATE handleDeleteProject function:
const handleDeleteProject = async (projectIdToDelete) => {
  if (!user) {
    displayMessage("Please log in to delete projects.", 'error');
    return;
  }
  if (window.confirm(`Delete project "${projectIdToDelete}"? This cannot be undone.`)) {
    setLoadingProjects(true);
    try {
      // Delete from 'projects' collection
      await deleteDoc(doc(db, 'projects', projectIdToDelete));
      displayMessage(`Project "${projectIdToDelete}" deleted.`, 'success');
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      displayMessage(`Failed to delete project: ${error.message}`, 'error');
    } finally {
      setLoadingProjects(false);
    }
  }
};

    // Header scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu/sidebar on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (window.innerWidth < 768 && sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSidebarOpen]);

    const handleLogout = async () => {
        try {
            localStorage.removeItem('adminAccess'); // Clear admin access
            await signOut(auth);
            navigate('/Authpage', { replace: true });
        } catch (error) {
            console.error("Error logging out:", error);
            displayMessage(`Logout failed: ${error.message}`, 'error');
        }
    };

    if (!authReady || !user) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] font-inter text-white"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                    <FaSpinner className="text-4xl text-purple-400 mr-3" />
                </motion.div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl"
                >
                    Loading Dashboard...
                </motion.p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`min-h-screen font-inter antialiased overflow-x-hidden ${mainBg} ${textColor} flex`}
        >
            {/* Custom CSS */}
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
                }
                
                .card {
                    background-color: ${theme === 'dark' ? 'var(--card-bg-dark)' : 'var(--card-bg-light)'};
                    border: 1px solid ${theme === 'dark' ? 'var(--card-border-dark)' : 'var(--card-border-light)'};
                    border-radius: 0.75rem;
                    padding: 1.5rem;
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }
                
                .text-highlight-gradient {
                    background: linear-gradient(90deg, #b34bff, #ff4aff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
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
            `}</style>

            {/* Header */}
            <motion.header
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center ${
                    isHeaderScrolled || isSidebarOpen 
                        ? theme === 'dark' 
                            ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' 
                            : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200'
                        : 'bg-transparent'
                }`}
            >
                {/* Left Section */}
                <div className="flex items-center space-x-5">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`text-2xl focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'} p-2 rounded-md hover:bg-gray-700 md:hidden`}
                        aria-label="Toggle sidebar"
                    >
                        <FaBars />
                    </motion.button>
                    
                    <Link to="/Dashboard" className={`flex items-center text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <motion.span 
                            animate={pulseAnimation}
                            className="text-highlight-gradient"
                        >
                            SILICON AI
                        </motion.span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                            TECHNOLOGIES
                        </span>
                        <svg className={`w-8 h-8 ml-2 text-highlight-gradient`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                    </Link>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-4">
                    {authReady && user && (
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className={`flex items-center p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}
                        >
                            <FaUserCircle className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mr-2`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} hidden sm:inline-block`}>
                                {userDisplayData.name}
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                userDisplayData.membershipStatus === 'free' 
                                    ? 'bg-blue-600 text-blue-100' 
                                    : 'bg-green-600 text-green-100'
                            }`}>
                                {userDisplayData.membershipStatus.charAt(0).toUpperCase() + userDisplayData.membershipStatus.slice(1)}
                            </span>
                            {userDisplayData.membershipStatus === 'free' && userDisplayData.aiUsesLeft !== 'N/A' && (
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-purple-600 text-purple-100`}>
                                    AI: {userDisplayData.aiUsesLeft}
                                </span>
                            )}
                        </motion.div>
                    )}

                    <div className="relative" ref={menuRef}>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200 focus:outline-none`}
                            aria-label="Open menu"
                        >
                            <FaEllipsisV className="text-xl" />
                        </motion.button>
                        
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                                    
                                    {/* Admin Login Option */}
                                    <button
                                        onClick={handleAdminLoginClick}
                                        className={`flex items-center w-full text-left px-4 py-2 ${theme === 'dark' ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-100'} transition-colors duration-200`}
                                    >
                                        <FaShieldAlt className="mr-3" /> Admin Login
                                    </button>
                                    
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

            {/* Sidebar */}
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
                        <motion.h3 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`text-xl font-bold mb-4 text-highlight-gradient`}
                        >
                            Navigation
                        </motion.h3>
                        
                        <motion.nav 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="mb-8 space-y-2"
                        >
                            {[
                                { path: '/Dashboard', icon: FaHome, label: 'HOME' },
                                { path: '/tools-overview', icon: FaTools, label: 'Tools' },
                                { path: '/project-management', icon: FaProjectDiagram, label: 'Your Projects' },
                                { path: '/learning-resources', icon: FaGraduationCap, label: 'Learning' },
                                { path: '/contactsupport', icon: FaQuestionCircle, label: 'Get Support' },
                            ].map((item, index) => (
                                <motion.li 
                                    key={index}
                                    variants={itemVariants}
                                    className="list-none"
                                >
                                    <Link 
                                        to={item.path}
                                        className={`flex items-center p-3 rounded-lg transition-colors ${
                                            location.pathname === item.path 
                                                ? 'active bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                : theme === 'dark' 
                                                    ? 'text-gray-200 hover:bg-gray-700' 
                                                    : 'text-gray-800 hover:bg-gray-100'
                                        }`}
                                    >
                                        <item.icon className="mr-4 text-xl" />
                                        {item.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.nav>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-white md:hidden"
                            aria-label="Close sidebar"
                        >
                            <FaTimes />
                        </motion.button>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex flex-col flex-grow pt-28 px-4 pb-8 md:px-8 ${mainBg} transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}
            >
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative text-center py-16 px-8 mb-12 rounded-xl overflow-hidden shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #2a0a4a, #1a0a2a)',
                        border: '1px solid #4a0a8a'
                    }}
                >
                    <div className="absolute inset-0 bg-dots-pattern opacity-30"></div>
                    <div className="relative z-10">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-white drop-shadow-md"
                        >
                            Welcome Back, <span className="text-gradient-purple-blue">{userDisplayData.name}!</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto"
                        >
                            Your hub for AI-powered chip and PCB design. Let's build something amazing today.
                        </motion.p>
                    </div>
                </motion.div>

                {/* Subscription Status */}
                {authReady && userProfile && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`mb-10 p-5 rounded-lg shadow-md flex items-center justify-between flex-wrap gap-4 ${
                            ['premium', 'pro', 'standard', 'enterprise'].includes(userProfile.membership)
                                ? 'bg-green-700/20 text-green-300'
                                : 'bg-blue-700/20 text-blue-300'
                        }`}
                    >
                        <motion.p 
                            whileHover={{ scale: 1.02 }}
                            className="text-lg font-semibold flex items-center"
                        >
                            <motion.span
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    transition: { repeat: Infinity, duration: 2 }
                                }}
                            >
                                <FaCheckCircle className="mr-3 text-2xl" />
                            </motion.span>
                            You are currently a{' '}
                            <span className={`ml-2 text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                {userProfile.membership ? userProfile.membership.charAt(0).toUpperCase() + userProfile.membership.slice(1) : 'Loading...'} Member
                            </span>
                        </motion.p>
                        
                        {(userProfile.membership === 'free' || userProfile.membership === 'standard' || userProfile.membership === 'pro') && (
                            <Link 
                                to="/pricing-page"
                                className="btn-gradient text-white py-2 px-6 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                Upgrade Plan <FaArrowRight className="ml-2 inline-block" />
                            </Link>
                        )}
                        
                        {userProfile.membership === 'enterprise' && (
                            <Link 
                                to="/your-membership"
                                className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} py-2 px-6 rounded-full font-semibold shadow-md hover:shadow-lg transition-all`}
                            >
                                Manage Membership
                            </Link>
                        )}
                    </motion.div>
                )}


                {/* Message Display */}
                {projectMessage.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-3 mb-4 rounded-md text-center ${
                            projectMessage.type === 'success' ? 'bg-green-700' : 'bg-red-700'
                        } text-white`}
                    >
                        {projectMessage.text}
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <h2 className={`text-3xl font-bold mb-6 ${textColor}`}>Quick Actions</h2>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
                    >
                        {/* Create New Project Card */}
                        <motion.div 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                            className="card flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                            onClick={handleCreateNewProject}
                        >
                            <motion.div
                                animate={pulseAnimation}
                            >
                                <FaPlus className="text-purple-500 text-5xl mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Create New Project</h3>
                            <p className={dimmedText}>Start a new chip or PCB design from scratch.</p>
                        </motion.div>

                        {/* Explore Tools Card */}
                        <motion.div 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                            className="card flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                            onClick={() => navigate('/tools-overview')}
                        >
                            <motion.div
                                animate={pulseAnimation}
                            >
                                <FaTools className="text-blue-500 text-5xl mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Explore All Tools</h3>
                            <p className={dimmedText}>Browse our full suite of AI-powered EDA tools.</p>
                        </motion.div>

                        {/* Manage Projects Card */}
                        <motion.div 
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            whileTap="tap"
                            className="card flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                            onClick={() => navigate('/project-management')}
                        >
                            <motion.div
                                animate={pulseAnimation}
                            >
                                <FaProjectDiagram className="text-green-500 text-5xl mb-4" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">Manage Your Projects</h3>
                            <p className={dimmedText}>View, load, share, and organize your design projects.</p>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Recent Projects */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <h2 className={`text-3xl font-bold mb-6 ${textColor}`}>Recent Projects</h2>
                    
                    {loadingProjects ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-10"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <FaSpinner className="text-5xl text-purple-500" />
                            </motion.div>
                            <p className="ml-4 text-xl text-gray-400">Loading projects...</p>
                        </motion.div>
                    ) : projects.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`p-8 text-center rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'} ${dimmedText}`}
                        >
                            <p className="text-lg">No projects found. Click "Create New Project" to get started!</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    variants={itemVariants}
                                    custom={index}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="card p-6 flex flex-col justify-between"
                                >
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                                        <p className={`text-sm ${dimmedText} mb-3`}>
                                            {project.type || 'General'} Project
                                        </p>
                                        <p className={`text-xs ${dimmedText}`}>
                                            Last Modified: {project.lastModified ? new Date(project.lastModified).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex justify-end space-x-2">
                                        <Link 
                                            to={`/tools/chip/rtl-editor?project=${project.id}`}
                                            className="text-blue-500 hover:text-blue-400 transition-colors"
                                        >
                                            Open in Editor
                                        </Link>
                                        <button 
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="text-red-500 hover:text-red-400 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* Admin Login Modal */}
                <AnimatePresence>
                    {showAdminLoginModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className={`relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} ${textColor} p-8 rounded-xl shadow-2xl w-full max-w-md`}
                            >
                                <h3 className="text-2xl font-bold mb-6 text-center">Admin Access</h3>
                                <p className={`text-center mb-6 ${dimmedText}`}>
                                    Enter admin credentials to access the admin panel
                                </p>
                                
                                {adminLoginError && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-900/20 text-red-400 px-4 py-3 rounded-md flex items-center mb-6"
                                    >
                                        <FaExclamationCircle className="mr-2" /> {adminLoginError}
                                    </motion.div>
                                )}
                                
                                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                                    <div className="flex flex-col space-y-2">
                                        <label htmlFor="username" className={`text-sm font-medium ${dimmedText}`}>Admin Username</label>
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            value={adminCredentials.username}
                                            onChange={handleAdminCredentialsChange}
                                            className={`input-field w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col space-y-2">
                                        <label htmlFor="code" className={`text-sm font-medium ${dimmedText}`}>Access Code</label>
                                        <input
                                            id="code"
                                            name="code"
                                            type="password"
                                            value={adminCredentials.code}
                                            onChange={handleAdminCredentialsChange}
                                            className={`input-field w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminLoginModal(false)}
                                            className={`py-2 px-6 rounded-md font-semibold ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-all`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-gradient text-white py-2 px-6 rounded-md font-semibold flex items-center justify-center transition-all"
                                        >
                                            <FaCheckCircle className="mr-2" /> Verify & Login
                                        </button>
                                    </div>
                                </form>
                                
                                <button
                                    onClick={() => setShowAdminLoginModal(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                    aria-label="Close modal"
                                >
                                    <FaTimes className="w-6 h-6" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>
        </motion.div>
    );
}

export default Dashboard;