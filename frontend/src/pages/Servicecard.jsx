// src/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FaMicrochip, FaVectorSquare, FaCloud, FaArrowRight } from 'react-icons/fa'; // Import icons, including FaArrowRight

function ServicesPage() {
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const serviceCategories = [
        {
            name: 'Chip Design Services',
            description: 'Comprehensive tools and expertise for Integrated Circuit (IC) design, from RTL to GDSII.',
            icon: <FaMicrochip className="text-teal-400 text-5xl mb-4" />,
            path: '/chip-services',
            status: 'working'
        },
        {
            name: 'PCB Design Services',
            description: 'All-in-one solutions for Printed Circuit Board (PCB) design, including schematic and layout.',
            icon: <FaVectorSquare className="text-red-400 text-5xl mb-4" />,
            path: '/pcb-services',
            status: 'working'
        },
        {
            name: 'Platform Services',
            description: 'Leverage cloud infrastructure, AI-assistance, and collaboration tools for your projects.',
            icon: <FaCloud className="text-blue-400 text-5xl mb-4" />,
            path: '/Platform-tools',
            status: 'working'
        },
        // Add more categories as needed
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2 // Delay animation of children
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.8 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const headerVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] p-4 font-inter text-white flex flex-col">
            <style jsx="true">{`
                /* Global fade-in-up from previous components, ensure it's still available */
                .fade-in-up {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
                }
                .fade-in-up.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* Styles for the service category cards - consistent across all service pages */
                .service-category-card {
                    background-color: #1a1a23;
                    border: 1px solid #333345;
                    border-radius: 0.75rem;
                    padding: 2rem;
                    transition: all 0.3s ease-in-out;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                    font-family: 'Inter', sans-serif; /* Ensure Inter is applied here */
                }
                .service-category-card:hover {
                    background-color: #24242e;
                    border-color: #a78bfa;
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
                }
                .coming-soon-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: #e0e0e0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.75rem;
                    font-weight: bold;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                    text-align: center;
                    font-size: 1.5rem;
                }
                .service-category-card.disabled:hover .coming-soon-overlay {
                    opacity: 1;
                }
                .service-category-card.disabled {
                    cursor: not-allowed;
                    opacity: 0.7;
                }
                .access-button {
                    background-color: #a78bfa;
                    color: white;
                    font-weight: bold;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    transition: background-color 0.2s ease, transform 0.2s ease;
                    width: 80%;
                    max-width: 200px;
                    font-family: 'Inter', sans-serif; /* Ensure Inter is applied here */
                }
                .access-button:hover {
                    background-color: #8b5cf6;
                    transform: translateY(-2px);
                }
                .access-button:disabled {
                    background-color: #4b5563;
                    cursor: not-allowed;
                }

                /* Flowchart specific styles */
                .flow-container {
                    display: flex;
                    flex-direction: column; /* Default to column for small screens */
                    align-items: center;
                    gap: 2rem; /* Gap between items */
                }

                .flow-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .horizontal-connector {
                    display: none; /* Hidden by default */
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0; /* Prevents shrinking */
                    width: 60px; /* Width of the line + arrow */
                    position: relative;
                }
                .horizontal-connector::before {
                    content: '';
                    height: 2px;
                    width: 100%;
                    background-color: #a78bfa;
                    position: absolute;
                }
                .horizontal-connector svg {
                    color: #a78bfa;
                    font-size: 1.5rem;
                    z-index: 10; /* Ensure arrow is above line */
                }

                /* Responsive adjustments for desktop layout */
                @media (min-width: 1024px) {
                    .flow-container {
                        flex-direction: row; /* Row for large screens */
                        justify-content: center;
                        align-items: flex-start; /* Align top for better visual flow */
                        gap: 0; /* Remove gap, use connector width for spacing */
                    }
                    .horizontal-connector {
                        display: flex; /* Show for large screens */
                    }
                }
            `}</style>
            <div className={`container mx-auto py-4 flex-grow flex flex-col transform transition-all duration-500 ${isVisible ? 'fade-in-up is-visible' : 'fade-in-up'}`}>

                {/* Header Bar for navigation (consistent) */}
                <div className="bg-[#1a1a23] p-4 rounded-xl shadow-lg mb-8 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2 font-inter"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        <span>Back</span>
                    </button>
                    {/* Main Page Title - Enhanced */}
                    <motion.h1
                        className="text-3xl md:text-5xl font-extrabold text-center flex-grow text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 font-inter"
                        variants={headerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        Our Core Services
                    </motion.h1>
                    <div className="w-24"></div> {/* Placeholder to balance "Back" button */}
                </div>

                <p className="text-center text-gray-300 text-lg mb-12 max-w-3xl mx-auto font-inter">
                    Choose from our specialized design service categories to start your next project.
                </p>

                {/* Flowchart Container */}
                <motion.div
                    className="flow-container"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {serviceCategories.map((category, index) => (
                        <React.Fragment key={index}>
                            <motion.div
                                className={`flow-item relative service-category-card ${category.status === 'upcoming' ? 'disabled' : ''}`}
                                variants={itemVariants}
                                whileHover={category.status === 'working' ? {
                                    translateY: -8,
                                    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.6)",
                                    backgroundColor: '#2e2e3a'
                                } : {}}
                            >
                                {category.status === 'upcoming' && (
                                    <div className="coming-soon-overlay">
                                        Coming Soon
                                    </div>
                                )}
                                <div className="flex flex-col items-center flex-grow">
                                    {category.icon}
                                    <h2 className="text-3xl font-semibold text-white mb-3 font-inter">{category.name}</h2>
                                    <p className="text-gray-400 text-base mb-6 flex-grow flex items-center text-center font-inter">
                                        {category.description}
                                    </p>
                                </div>
                                {category.status === 'working' ? (
                                    <Link
                                        to={category.path}
                                        className="access-button w-full"
                                    >
                                        Explore Services
                                    </Link>
                                ) : (
                                    <button
                                        disabled
                                        className="access-button w-full opacity-50 cursor-not-allowed"
                                    >
                                        Explore Services
                                    </button>
                                )}
                            </motion.div>
                            {/* Render horizontal connector if not the last item */}
                            {index < serviceCategories.length - 1 && (
                                <motion.div
                                    className="horizontal-connector"
                                    variants={containerVariants} // Use container variants to allow arrow to animate with delay
                                >
                                    <FaArrowRight />
                                </motion.div>
                            )}
                        </React.Fragment>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

export default ServicesPage;
