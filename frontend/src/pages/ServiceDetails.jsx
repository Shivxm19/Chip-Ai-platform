import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function ServicesPage() {
    const location = useLocation(); // ✅ Correct usage
    const searchParams = new URLSearchParams(location.search);
    const serviceType = searchParams.get("services"); // ✅ Get value from URL like ?services=chip

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Chip Design Services
    const chipServices = [
        { name: 'RTL Editor', status: 'working' },
        { name: 'Synthesis', status: 'coming-soon' },
        { name: 'Static Timing Analysis (STA)', status: 'coming-soon' },
        { name: 'Floorplanning', status: 'coming-soon' },
        { name: 'Placement & Routing', status: 'coming-soon' },
        { name: 'GDSII Viewer', status: 'coming-soon' },
        { name: 'DRC Checks', status: 'coming-soon' },
        { name: 'ERC Checks', status: 'coming-soon' },
        { name: 'Power Analysis', status: 'coming-soon' },
        { name: 'Formal Verification', status: 'coming-soon' }
    ];

    // PCB Design Services
    const pcbServices = [
        { name: 'PCB Schematic Editor', status: 'working' },
        { name: 'PCB Layout Editor', status: 'working' },
        { name: 'Component Selection', status: 'coming-soon' },
        { name: 'Signal Integrity Analysis', status: 'coming-soon' },
        { name: 'Power Integrity Analysis', status: 'coming-soon' },
        { name: 'Thermal Analysis', status: 'coming-soon' },
        { name: 'Gerber File Generation', status: 'coming-soon' },
        { name: 'Manufacturing Design Check (DFM)', status: 'coming-soon' },
        { name: 'Assembly Documentation', status: 'coming-soon' },
        { name: 'Test Point Analysis', status: 'coming-soon' }
    ];

    // Decide which service list to use
    const currentServices = serviceType =='chip'? chipServices :
                            serviceType =='pcb' ? pcbServices : null;

    const pageTitle = serviceType ='chip'?'Chip Design Services' :
                      serviceType ='pcb'?'PCB Design Services' : 'Our Services';

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
                .feature-card {
                    background-color: #24242e;
                    border-radius: 1rem;
                    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .feature-card:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 15px 20px rgba(0, 0, 0, 0.3);
                }
                .feature-icon {
                    color: #a78bfa;
                }
                .sub-service-item {
                    background-color: #1a1a23;
                    border: 1px solid #333345;
                    border-radius: 0.5rem;
                    padding: 1rem 1.5rem;
                    transition: background-color 0.2s ease, border-color 0.2s ease;
                }
                .sub-service-item:hover {
                    background-color: #24242e;
                    border-color: #a78bfa;
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
                    border-radius: 0.5rem;
                    font-weight: bold;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                }
                .sub-service-item:hover .coming-soon-overlay {
                    opacity: 1;
                }
                .sub-service-item.disabled {
                    cursor: not-allowed;
                    opacity: 0.7;
                }
            `}</style>

            <div className={`container mx-auto py-16 px-6 md:px-12 transform transition-all duration-500 ${isVisible ? 'fade-in-up is-visible' : 'fade-in-up'}`}>
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">{pageTitle}</h1>

                {currentServices ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentServices.map((subService, index) => (
                            <div key={index} className={`relative sub-service-item ${subService.status === 'coming-soon' ? 'disabled' : ''}`}>
                                {subService.status === 'working' ? (
                                    <Link
                                        to={`/tool/${serviceType}/${encodeURIComponent(subService.name.toLowerCase().replace(/\s/g, '-'))}`}
                                        className="block h-full w-full flex flex-col justify-center items-center text-center py-4 px-2"
                                    >
                                        <span className="text-lg font-medium">{subService.name}</span>
                                    </Link>
                                ) : (
                                    <div className="h-full w-full flex flex-col justify-center items-center text-center py-4 px-2">
                                        <span className="text-lg font-medium">{subService.name}</span>
                                        <div className="coming-soon-overlay">
                                            Coming Soon
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Link to="/services?services=chip" className="block feature-card p-8 flex flex-col items-center text-center">
                            <div className="feature-icon mb-6">
                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 7.373a4.746 4.746 0 010 9.254a4.746 4.746 0 010-9.254zM19 7.373a4.746 4.746 0 010 9.254a4.746 4.746 0 010-9.254zM22 12c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h12c2.21 0 4 1.79 4 4z"/>
                                </svg>
                            </div>
                            <h2 className="text-3xl font-semibold mb-4">Chip Design</h2>
                            <p className="text-gray-300 text-lg mb-6">
                                Cutting-edge solutions for RTL design and high-performance ICs.
                            </p>
                            <span className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105">
                                Explore Chip Services
                            </span>
                        </Link>

                        <Link to="/services?services=pcb" className="block feature-card p-8 flex flex-col items-center text-center">
                            <div className="feature-icon mb-6">
                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9.75 12L12 9.75L17 9.75M17 14V17M14 17H17M17 14L14 17M12 9.75V12.75L14 14.75V17L12 17L9.75 14.75V12.75M9.75 12.75L7 10L7 7.75L9.75 5L12 7.75L12 10L9.75 12.75Z"/>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
                                </svg>
                            </div>
                            <h2 className="text-3xl font-semibold mb-4">PCB Design</h2>
                            <p className="text-gray-300 text-lg mb-6">
                                Optimized Printed Circuit Boards for real-world applications.
                            </p>
                            <span className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105">
                                Explore PCB Services
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ServicesPage;