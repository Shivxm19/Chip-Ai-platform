// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    collection,
    query,
    onSnapshot,
    orderBy,
    doc,
    getDoc,
    updateDoc
} from '../firebaseconfig';
import { getMyProfile, updateMyProfile } from '../services/authService';

import Button from '../components/UI/Uibutton';
import InputField from '../components/UI/inputfield';
import { 
    FaEdit, FaTimes, FaCheckCircle, FaExclamationCircle, 
    FaSpinner, FaUserShield, FaUser, FaCrown, 
    FaDollarSign, FaBolt, FaEnvelope, FaChartBar,
    FaChartLine, FaChartPie, FaUsers, FaMoneyBillWave
} from 'react-icons/fa';

// Chart imports
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 25 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // State for editing user modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        displayName: '',
        email: '',
        role: 'user',
        membership: 'free',
        aiUsesLeft: 0,
    });
    const [updatingUser, setUpdatingUser] = useState(false);
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

    // Effect for initial authentication and user profile fetching
    useEffect(() => {
        // Check if admin access was granted
        const adminAccess = localStorage.getItem('adminAccess') === 'true';
        if (!adminAccess) {
            navigate('/admin-panel');
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const profile = await getMyProfile();
                    setCurrentUserProfile(profile);
                    
                    if (!profile?.isAdmin) {
                        navigate('/dashboard');
                    }
                } catch (error) {
                    console.error("AdminPage: Error fetching user profile:", error);
                    navigate('/Dashboard');
                }
            } else {
                navigate('/auth');
            }
            setAuthReady(true);
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    // Effect to fetch all users and statistics
    useEffect(() => {
        if (!authReady || !currentUserProfile?.isAdmin || !db) {
            setLoadingUsers(false);
            setUsers([]);
            return;
        }

        setLoadingUsers(true);
        setError('');

        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribeUsers = onSnapshot(q, async (snapshot) => {
            const fetchedUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(fetchedUsers);
            setLoadingUsers(false);

            // Calculate statistics
            calculateStatistics(fetchedUsers);
        }, (err) => {
            console.error("Error fetching users:", err);
            setError('Failed to load users: ' + err.message);
            setLoadingUsers(false);
        });

        return () => unsubscribeUsers();
    }, [authReady, currentUserProfile?.isAdmin, db]);

    const calculateStatistics = (users) => {
        setLoadingStats(true);
        
        // Mock revenue data - replace with actual subscription data from your database
        const membershipPrices = {
            free: 0,
            standard: 9.99,
            pro: 19.99,
            enterprise: 49.99
        };

        const activeSubscriptions = users.filter(user => 
            user.membership && user.membership !== 'free'
        ).length;

        const totalRevenue = users.reduce((sum, user) => {
            return sum + (membershipPrices[user.membership] || 0);
        }, 0);

        const currentMonth = new Date().getMonth();
        const newUsersThisMonth = users.filter(user => {
            const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
            return userDate.getMonth() === currentMonth;
        }).length;

        setStats({
            totalUsers: users.length,
            activeSubscriptions,
            totalRevenue,
            newUsersThisMonth
        });
        
        setLoadingStats(false);
    };

    const handleLogout = async () => {
        try {
            localStorage.removeItem('adminAccess'); // Clear admin access
            await signOut(auth);
            navigate('/auth');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    // Handle opening the edit modal
    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            displayName: user.displayName || '',
            email: user.email || '',
            role: user.role || 'user',
            membership: user.membership || 'free',
            aiUsesLeft: user.aiUsesLeft !== undefined ? user.aiUsesLeft : 0,
        });
        setUpdateMessage({ type: '', text: '' });
        setShowEditModal(true);
    };

    // Handle form input changes in the edit modal
    const handleEditFormChange = (e) => {
        const { id, value } = e.target;
        setEditFormData(prev => ({ ...prev, [id]: value }));
    };

    // Handle submitting the edited user data
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        setUpdatingUser(true);
        setUpdateMessage({ type: '', text: '' });

        try {
            await updateMyProfile(editingUser.firebaseUid, {
                name: editFormData.displayName,
                email: editFormData.email,
                role: editFormData.role,
                membership: editFormData.membership,
                aiUsesLeft: editFormData.aiUsesLeft,
            });
            setUpdateMessage({ type: 'success', text: 'User updated successfully!' });
            setTimeout(() => setShowEditModal(false), 1500);
        } catch (err) {
            console.error("Error updating user:", err);
            setUpdateMessage({ type: 'error', text: `Failed to update user: ${err.message}` });
        } finally {
            setUpdatingUser(false);
        }
    };

    // Chart data configurations
    const membershipDistributionData = {
        labels: ['Free', 'Standard', 'Pro', 'Enterprise'],
        datasets: [
            {
                label: 'Users',
                data: [
                    users.filter(u => u.membership === 'free').length,
                    users.filter(u => u.membership === 'standard').length,
                    users.filter(u => u.membership === 'pro').length,
                    users.filter(u => u.membership === 'enterprise').length,
                ],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const monthlyGrowthData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'New Users',
                data: [12, 19, 15, 27, 34, 42, 38, 51, 47, 60, 72, 85], // Mock data - replace with actual monthly data
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const revenueData = {
        labels: ['Standard', 'Pro', 'Enterprise'],
        datasets: [
            {
                label: 'Monthly Revenue ($)',
                data: [stats.activeSubscriptions * 9.99, stats.activeSubscriptions * 19.99, stats.activeSubscriptions * 49.99], // Mock data
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (!authReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <p className="text-xl font-semibold text-gray-700">Loading Admin Panel...</p>
                </div>
            </div>
        );
    }

    if (!currentUser || !currentUserProfile?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100 p-4 font-sans">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <FaUserShield className="text-6xl text-red-500 mb-4 mx-auto" />
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
                    <p className="text-gray-700">You do not have administrative privileges to view this page.</p>
                    <p className="text-gray-500 text-sm mt-2">Please ensure you are logged in with an admin account.</p>
                </div>
            </div>
        );
    }

    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const cardBg = theme === 'dark' ? 'bg-[#1a1a23]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const highlightColor = theme === 'dark' ? 'text-purple-400' : 'text-purple-600';

    return (
        <div className={`min-h-screen font-inter antialiased overflow-x-hidden ${mainBg} ${textColor} p-4 md:p-8 pt-28`}>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-highlight-gradient">Admin Dashboard</h1>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full bg-purple-500/10 mr-4`}>
                                <FaUsers className={`text-2xl ${highlightColor}`} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-medium ${dimmedText}`}>Total Users</h3>
                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full bg-green-500/10 mr-4`}>
                                <FaMoneyBillWave className={`text-2xl text-green-500`} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-medium ${dimmedText}`}>Active Subscriptions</h3>
                                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full bg-yellow-500/10 mr-4`}>
                                <FaDollarSign className={`text-2xl text-yellow-500`} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-medium ${dimmedText}`}>Monthly Revenue</h3>
                                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                        <div className="flex items-center">
                            <div className={`p-3 rounded-full bg-blue-500/10 mr-4`}>
                                <FaUser className={`text-2xl text-blue-500`} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-medium ${dimmedText}`}>New This Month</h3>
                                <p className="text-2xl font-bold">{stats.newUsersThisMonth}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 font-medium ${activeTab === 'users' ? `${highlightColor} border-b-2 border-purple-500` : dimmedText}`}
                    >
                        <FaUsers className="inline mr-2" /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 font-medium ${activeTab === 'analytics' ? `${highlightColor} border-b-2 border-purple-500` : dimmedText}`}
                    >
                        <FaChartBar className="inline mr-2" /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`px-4 py-2 font-medium ${activeTab === 'revenue' ? `${highlightColor} border-b-2 border-purple-500` : dimmedText}`}
                    >
                        <FaDollarSign className="inline mr-2" /> Revenue
                    </button>
                </div>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6 mb-8`}>
                        <h2 className={`text-2xl font-bold mb-6 ${textColor}`}>User Management</h2>

                        {loadingUsers && (
                            <div className="text-center py-8">
                                <FaSpinner className="animate-spin text-4xl text-purple-500 mx-auto mb-4" />
                                <p className={dimmedText}>Loading users...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-900/20 text-red-400 px-4 py-3 rounded-md flex items-center mb-6">
                                <FaExclamationCircle className="mr-2" /> {error}
                            </div>
                        )}

                        {!loadingUsers && users.length === 0 && !error && (
                            <p className={dimmedText}>No users found.</p>
                        )}

                        {!loadingUsers && users.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>User ID</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>Email</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>Display Name</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>Role</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>Membership</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>AI Uses</th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium ${dimmedText} uppercase tracking-wider`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {users.map((user) => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 break-all">{user.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.displayName || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        user.membership === 'premium' ? 'bg-green-100 text-green-800' :
                                                        user.membership === 'enterprise' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {user.membership || 'free'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.aiUsesLeft !== undefined ? user.aiUsesLeft : 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button
                                                        onClick={() => handleEditClick(user)}
                                                        variant="secondary"
                                                        icon={FaEdit}
                                                        className="text-purple-400 hover:text-purple-600"
                                                    >
                                                        Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                            <h3 className={`text-xl font-bold mb-4 ${textColor}`}>
                                <FaChartPie className="inline mr-2" /> Membership Distribution
                            </h3>
                            <div className="h-64">
                                <Pie 
                                    data={membershipDistributionData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                            <h3 className={`text-xl font-bold mb-4 ${textColor}`}>
                                <FaChartLine className="inline mr-2" /> User Growth
                            </h3>
                            <div className="h-64">
                                <Line 
                                    data={monthlyGrowthData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                grid: {
                                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                },
                                                ticks: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            },
                                            y: {
                                                grid: {
                                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                },
                                                ticks: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Revenue Tab */}
                {activeTab === 'revenue' && (
                    <div className="grid grid-cols-1 gap-6 mb-8">
                        <div className={`rounded-xl shadow-lg border ${cardBg} ${cardBorder} p-6`}>
                            <h3 className={`text-xl font-bold mb-4 ${textColor}`}>
                                <FaDollarSign className="inline mr-2" /> Revenue Breakdown
                            </h3>
                            <div className="h-64">
                                <Bar 
                                    data={revenueData} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                grid: {
                                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                },
                                                ticks: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            },
                                            y: {
                                                grid: {
                                                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                                },
                                                ticks: {
                                                    color: theme === 'dark' ? '#E5E7EB' : '#374151'
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                <AnimatePresence>
                    {showEditModal && editingUser && (
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
                                className={`relative ${cardBg} ${textColor} p-8 rounded-xl shadow-2xl w-full max-w-md`}
                            >
                                <h3 className="text-2xl font-bold mb-6 text-center">Edit User: {editingUser.displayName || editingUser.email}</h3>
                                {updateMessage.text && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`mb-6 p-3 rounded-md flex items-center text-sm ${
                                            updateMessage.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'
                                        }`}
                                    >
                                        {updateMessage.type === 'error' ? <FaExclamationCircle className="mr-2" /> : <FaCheckCircle className="mr-2" />}
                                        {updateMessage.text}
                                    </motion.p>
                                )}
                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <InputField
                                        id="displayName"
                                        label="Display Name"
                                        type="text"
                                        value={editFormData.displayName}
                                        onChange={handleEditFormChange}
                                        icon={FaUser}
                                    />
                                    <InputField
                                        id="email"
                                        label="Email"
                                        type="email"
                                        value={editFormData.email}
                                        onChange={handleEditFormChange}
                                        icon={FaEnvelope}
                                        disabled
                                    />
                                    <div className="flex flex-col space-y-2">
                                        <label htmlFor="role" className={`text-sm font-medium ${dimmedText}`}>Role</label>
                                        <select
                                            id="role"
                                            value={editFormData.role}
                                            onChange={handleEditFormChange}
                                            className={`input-field w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <label htmlFor="membership" className={`text-sm font-medium ${dimmedText}`}>Membership Status</label>
                                        <select
                                            id="membership"
                                            value={editFormData.membership}
                                            onChange={handleEditFormChange}
                                            className={`input-field w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                                        >
                                            <option value="free">Free</option>
                                            <option value="standard">Standard</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                    <InputField
                                        id="aiUsesLeft"
                                        label="AI Uses Left"
                                        type="number"
                                        value={editFormData.aiUsesLeft}
                                        onChange={handleEditFormChange}
                                        icon={FaBolt}
                                    />

                                    <div className="flex justify-end space-x-4 mt-6">
                                        <Button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={updatingUser}
                                            variant="primary"
                                            icon={updatingUser ? FaSpinner : FaCheckCircle}
                                            className={updatingUser ? 'animate-pulse' : ''}
                                        >
                                            {updatingUser ? 'Updating...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                    aria-label="Close modal"
                                >
                                    <FaTimes className="w-6 h-6" />
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminPanel;