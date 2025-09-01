// src/components/BackButton.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

function BackButton({ theme }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Do not show the back button on the landing page ("/")
    if (location.pathname === '/') {
        return null;
    }

    const buttonVariants = {
        rest: { scale: 1, x: 0 },
        hover: { scale: 1.05, x: -3 },
        tap: { scale: 0.95 }
    };

    return (
        <motion.button
            onClick={() => navigate(-1)} // Navigate back in history
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white focus:ring-gray-600' : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'
            }`}
            aria-label="Go back to previous page"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <FaArrowLeft className="text-xl" />
            <span className="hidden sm:inline"></span>
        </motion.button>
    );
}

export default BackButton;
