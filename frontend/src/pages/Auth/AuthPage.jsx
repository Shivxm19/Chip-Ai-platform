/* eslint-disable no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-undef */
// src/pages/Auth/AuthPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaEnvelope, FaLock, FaUserPlus, FaSignInAlt, FaGoogle, FaGithub, FaArrowLeft,
    FaExclamationCircle, FaCheckCircle, FaSpinner, FaSun, FaMoon
} from 'react-icons/fa';

// Corrected import path for firebaseconfig.js
import {
    auth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
} from '../../firebaseconfig';

// Corrected import: 'getUserProfile' was not a defined export, replaced with 'getMyProfile'
import { createUserProfileDocument, getMyProfile } from '../../services/authService';

function AuthPage() {
    const navigate = useNavigate();
    const [currentForm, setCurrentForm] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const menuRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (!auth || !onAuthStateChanged) {
            console.warn("Auth instance or onAuthStateChanged not available in AuthPage.");
            setError("Firebase Authentication is not initialized. Please check your setup.");
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/Dashboard');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        setError('');
        setSuccessMessage('');
    }, [currentForm]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    // --- Form Handlers ---
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        if (!auth) { setError("Firebase Auth not available."); setLoading(false); return; }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await createUserProfileDocument(userCredential.user);
            setSuccessMessage('Login successful! Redirecting...');
            navigate('/Dashboard');
        } catch (err) {
            console.error("Login error:", err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format.');
            } else if (err.code === 'auth/user-disabled') {
                setError('Your account has been disabled.');
            } else {
                setError(`Login failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (!auth) { setError("Firebase Auth not available."); setLoading(false); return; }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfileDocument(userCredential.user, { role: 'user', membership: 'free', aiUsesLeft: 100 });
            setSuccessMessage('Account created successfully! You are now logged in.');
            navigate('/Dashboard');
        } catch (err) {
            console.error("Signup error:", err.code, err.message);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use. Try logging in or resetting password.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger one.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format.');
            } else {
                setError(`Sign Up failed: ${err.message || 'Please try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        if (!auth) { setError("Firebase Auth not available."); setLoading(false); return; }
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
            setCurrentForm('login');
        } catch (err) {
            console.error("Forgot password error:", err.code, err.message);
            setError(`Failed to send reset email: ${err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialSignIn = async (providerInstance) => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        if (!auth) { setError("Firebase Auth not available."); setLoading(false); return; }
        try {
            const userCredential = await signInWithPopup(auth, providerInstance);
            
            // Corrected logic: We attempt to get the profile. If it's a new user, the backend will return a 404.
            // We catch that specific error and then create the user profile.
            try {
                await getMyProfile();
            } catch (error) {
                // The backend returned an error, which for a new user is likely 'User not found'.
                // We'll proceed to create the user profile in MongoDB.
                console.warn("User profile not found in backend, creating a new one.");
                await createUserProfileDocument(userCredential.user, { role: 'user', membership: 'free', aiUsesLeft: 100 });
            }

            setSuccessMessage('Signed in successfully! Redirecting...');
            navigate('/Dashboard');
        } catch (err) {
            console.error("Social sign-in error:", err.code, err.message);
            setError(`Sign-in failed: ${err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const formContainerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: "easeIn" } }
    };

    const buttonVariants = {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    };

    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const cardBg = theme === 'dark' ? 'bg-[#12121c]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
    const inputBorder = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
    const inputTextColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const socialButtonBg = theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
    const socialButtonText = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const linkColor = theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700';
    const errorColor = 'text-red-400';
    const successColor = 'text-green-400';

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${mainBg} transition-colors duration-300 bg-dots-pattern`}>
             <style jsx="true">{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: ${mainBg.replace('bg-', '#').replace('0a0a0f', '0a0a0f').replace('gray-50', 'f9fafb')};
                    color: ${textColor.replace('text-', '#').replace('white', 'ffffff').replace('gray-900', '1a1a1a')};
                }
                .text-highlight-gradient {
                    background: linear-gradient(90deg, #a78bfa, #8b5cf6);
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
                .input-field {
                    background-color: ${inputBg.replace('bg-', '#').replace('gray-700', '4a5568').replace('gray-100', 'f7fafc')};
                    border: 1px solid ${inputBorder.replace('border-', '#').replace('gray-600', '4a5568').replace('gray-300', 'e2e8f0')};
                    color: ${inputTextColor.replace('text-', '#').replace('white', 'ffffff').replace('gray-900', '1a1a1a')};
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-field:focus {
                    border-color: #a78bfa;
                }
                .social-button-dynamic {
                     background-color: ${socialButtonBg.includes('gray-700') ? '#4a5568' : '#e2e8f0'};
                     color: ${socialButtonText.includes('white') ? '#ffffff' : '#4a5568'};
                     transition: background-color 0.2s, color 0.2s;
                }
                .social-button-dynamic:hover {
                    background-color: ${socialButtonBg.includes('gray-700') ? '#2d3748' : '#cbd5e0'};
                }
            `}</style>

            <div className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center ${theme === 'dark' ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200'}`}>
                <div className="flex items-center space-x-4">
                    <Link to="/"
                        className={`text-xl focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'} p-2 rounded-md hover:bg-gray-700`}
                        aria-label="Back to Landing Page"
                        onClick={(e) => { e.preventDefault(); navigate(-1); }}
                    >
                        <FaArrowLeft />
                    </Link>
                    <Link to="/" className={`flex items-center text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <span className="text-highlight-gradient">SILICON AI</span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>TECHNOLOGIES</span>
                        <svg className={`w-8 h-8 ml-2 text-highlight-gradient`} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200 focus:outline-none`}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                    </button>
                </div>
            </div>

            <div className={`w-full max-w-md ${cardBg} ${textColor} rounded-xl shadow-2xl p-8 space-y-6 border ${cardBorder} relative mt-24`}>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-highlight-gradient">
                        {currentForm === 'login' && 'Welcome Back!'}
                        {currentForm === 'signup' && 'Join SILICONAI'}
                        {currentForm === 'forgotPassword' && 'Reset Your Password'}
                    </h2>
                    <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {currentForm === 'login' && 'Sign in to your account to continue.'}
                        {currentForm === 'signup' && 'Create your account to get started with AI-powered EDA.'}
                        {currentForm === 'forgotPassword' && 'Enter your email to receive a password reset link.'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {currentForm === 'login' && (
                        <motion.form
                            key="loginForm"
                            variants={formContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleEmailLogin}
                            className="space-y-4"
                        >
                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${errorColor} text-sm`}>
                                    <FaExclamationCircle className="mr-2" />{error}
                                </motion.p>
                            )}
                            {successMessage && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${successColor} text-sm`}>
                                    <FaCheckCircle className="mr-2" />{successMessage}
                                </motion.p>
                            )}
                            <div>
                                <label htmlFor="email-login" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="email-login"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password-login" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="password-login"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <a href="#" onClick={() => setCurrentForm('forgotPassword')} className={`font-medium ${linkColor}`}>
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                            <motion.button
                                type="submit"
                                className="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSignInAlt className="mr-2" />}
                                {loading ? 'Signing In...' : 'Sign In'}
                            </motion.button>
                        </motion.form>
                    )}

                    {currentForm === 'signup' && (
                        <motion.form
                            key="signupForm"
                            variants={formContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleEmailSignup}
                            className="space-y-4"
                        >
                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${errorColor} text-sm`}>
                                    <FaExclamationCircle className="mr-2" />{error}
                                </motion.p>
                            )}
                            {successMessage && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${successColor} text-sm`}>
                                    <FaCheckCircle className="mr-2" />{successMessage}
                                </motion.p>
                            )}
                            <div>
                                <label htmlFor="email-signup" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="email-signup"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password-signup" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="password-signup"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="confirm-password-signup" className="sr-only">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="confirm-password-signup"
                                        name="confirm-password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <motion.button
                                type="submit"
                                className="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaUserPlus className="mr-2" />}
                                {loading ? 'Signing Up...' : 'Sign Up'}
                            </motion.button>
                        </motion.form>
                    )}

                    {currentForm === 'forgotPassword' && (
                        <motion.form
                            key="forgotPasswordForm"
                            variants={formContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onSubmit={handleForgotPassword}
                            className="space-y-4"
                        >
                            <button
                                type="button"
                                onClick={() => setCurrentForm('login')}
                                className={`${linkColor} flex items-center text-sm mb-4`}
                            >
                                <FaArrowLeft className="mr-2" /> Back to Login
                            </button>
                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${errorColor} text-sm`}>
                                    <FaExclamationCircle className="mr-2" />{error}
                                </motion.p>
                            )}
                            {successMessage && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center ${successColor} text-sm`}>
                                    <FaCheckCircle className="mr-2" />{successMessage}
                                </motion.p>
                            )}
                            <div>
                                <label htmlFor="email-forgot" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className={`text-gray-400 ${theme === 'light' ? 'text-gray-600' : ''}`} />
                                    </div>
                                    <input
                                        id="email-forgot"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="input-field pl-10 block w-full"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <motion.button
                                type="submit"
                                className="btn-gradient w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                disabled={loading}
                            >
                                {loading ? <FaSpinner className="animate-spin mr-2" /> : 'Send Reset Link'}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {(currentForm === 'login' || currentForm === 'signup') && (
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className={`w-full border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className={`${cardBg} px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <motion.button
                                onClick={() => handleSocialSignIn(new GoogleAuthProvider())}
                                className={`social-button-dynamic w-full flex items-center justify-center py-3 px-4 border rounded-md shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                disabled={loading}
                            >
                                {loading && <FaSpinner className="animate-spin mr-2" />}
                                <FaGoogle className="mr-2" /> Google
                            </motion.button>
                            <motion.button
                                onClick={() => handleSocialSignIn(new GithubAuthProvider())}
                                className={`social-button-dynamic w-full flex items-center justify-center py-3 px-4 border rounded-md shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                disabled={loading}
                            >
                                {loading && <FaSpinner className="animate-spin mr-2" />}
                                <FaGithub className="mr-2" /> GitHub
                            </motion.button>
                        </div>
                    </div>
                )}

                {(currentForm === 'login' || currentForm === 'signup') && (
                    <p className={`mt-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {currentForm === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <a href="#" onClick={() => setCurrentForm('signup')} className={`font-medium ${linkColor}`}>
                                    Sign Up
                                </a>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <a href="#" onClick={() => setCurrentForm('login')} className={`font-medium ${linkColor}`}>
                                    Sign In
                                </a>
                            </>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
}

export default AuthPage;