// src/pages/AboutUsPage.jsx
import React, { useState, useEffect } from 'react';

function AboutUsPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] p-4 font-inter text-white">
            <style jsx="true">{`
                .fade-in-up {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
                }
                .fade-in-up.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                .card {
                    background-color: #1a1a23;
                    border-radius: 1rem;
                    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
                    padding: 2.5rem;
                }
            `}</style>
            <div className={`container mx-auto py-16 px-6 md:px-12 transform transition-all duration-500 ${isVisible ? 'fade-in-up is-visible' : 'fade-in-up'}`}>
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">About SILICONAI TECHNOLOGIES</h1>

                <div className="card max-w-4xl mx-auto space-y-8">
                    <p className="text-gray-300 text-lg leading-relaxed">
                        At SILICONAI TECHNOLOGIES, we are revolutionizing the semiconductor industry by integrating advanced Artificial Intelligence into Electronic Design Automation (EDA) workflows. Our mission is to empower both established and emerging companies with intelligent tools that accelerate chip design, optimize PCB layouts, and enhance overall manufacturing efficiency.
                    </p>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Founded by a team of passionate engineers and AI specialists, we are committed to pushing the boundaries of what's possible in microchip development. We believe that AI is the key to unlocking new levels of innovation, reducing design cycles, and achieving unprecedented performance in the complex world of silicon.
                    </p>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Our solutions are built with a focus on user-friendliness, scalability, and robust performance, catering to the unique needs of semiconductor startups, small, and mid-sized design firms. We strive to provide accessible, powerful tools that democratize access to cutting-edge design capabilities.
                    </p>
                    <h2 className="text-3xl font-bold text-white mt-12 mb-4 text-center">Our Vision</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        To be the leading provider of AI-powered EDA solutions, enabling a future where chip design is more intuitive, efficient, and innovative than ever before. We envision a world where complex electronic systems can be designed and manufactured with unparalleled speed and precision.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AboutUsPage;
