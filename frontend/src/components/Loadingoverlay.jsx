// src/components/LoadingOverlay.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaMicrochip } from 'react-icons/fa'; // Using FaMicrochip for a thematic touch

const LoadingOverlay = ({ isLoading }) => {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0f] bg-opacity-95 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="flex flex-col items-center text-white"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                            className="relative"
                        >
                            <FaMicrochip className="text-8xl text-purple-600 opacity-70" />
                            <FaSpinner className="absolute inset-0 m-auto text-5xl text-purple-400 animate-spin" />
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="mt-8 text-3xl font-bold text-gradient-purple-blue"
                        >
                            Loading SiliconAI...
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="mt-2 text-lg text-gray-400"
                        >
                            Innovating the future of electronics.
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingOverlay;
