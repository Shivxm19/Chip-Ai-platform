// src/pages/ContactPage.jsx
import React, { useState, useEffect } from 'react';

function ContactPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] p-4 font-inter text-white">
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
                .contact-card {
                    background-color: #1a1a23;
                    border-radius: 1rem;
                    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
                    padding: 2.5rem;
                }
                .input-field {
                    background-color: #0d0d12;
                    border: 1px solid #333345;
                    color: #e0e0e0;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-field:focus {
                    border-color: #a78bfa;
                }
            `}</style>
            <div className={`container mx-auto py-16 px-6 md:px-12 transform transition-all duration-500 ${isVisible ? 'fade-in-up is-visible' : 'fade-in-up'}`}>
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">Contact Us</h1>

                <div className="contact-card max-w-2xl mx-auto">
                    <p className="text-gray-300 text-lg text-center mb-8">
                        Have questions, feedback, or a partnership inquiry? Reach out to us using the form below, or connect through our social channels.
                    </p>

                    <form className="space-y-6">
                        <div>
                            <label htmlFor="name" className="sr-only">Name</label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Your Name"
                                className="input-field w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Your Email Address"
                                className="input-field w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="subject" className="sr-only">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                placeholder="Subject"
                                className="input-field w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="sr-only">Message</label>
                            <textarea
                                id="message"
                                rows="5"
                                placeholder="Your Message"
                                className="input-field w-full resize-none"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 transform hover:scale-105"
                        >
                            Send Message
                        </button>
                    </form>

                    <div className="mt-10 text-center text-gray-400">
                        <p className="mb-2">Or find us on:</p>
                        <div className="flex justify-center space-x-6">
                            <a href="https://linkedin.com/company/siliconai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.742 7 2.406v6.829z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="mailto:info@siliconai.com" className="hover:text-white transition-colors duration-200">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M2.5 5.5C2.5 4.67157 3.17157 4 4 4H20C20.8284 4 21.5 4.67157 21.5 5.5V18.5C21.5 19.3284 20.8284 20 20 20H4C3.17157 20 2.5 19.3284 2.5 18.5V5.5ZM4 6.25L12 11.75L20 6.25V5.5H4V6.25ZM20 18.5V7.75L12 13.25L4 7.75V18.5H20Z" clipRule="evenodd"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactPage;
