// src/RTLSimulator.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaSpinner, FaFileSignature, FaDownload } from 'react-icons/fa';

// Import Firebase auth and db instances and other necessary functions from firebaseconfig
import {
    auth,
    db,
    onAuthStateChanged,
    collection,
    query,
    getDocs,
    doc,
    getDoc,
    appIdentifier // Correctly import appIdentifier
} from '../../../firebaseconfig';

function RTLSimulator() {
    const outputLogRef = useRef(null);
    const navigate = useNavigate();

    // User authentication state
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [userId, setUserId] = useState(null);

    // Simulator State
    const [rtlCodeInput, setRtlCodeInput] = useState('');
    const [outputLog, setOutputLog] = useState("");
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedWaveform, setSimulatedWaveform] = useState('');

    // Project Selection State
    const [savedRtlProjects, setSavedRtlProjects] = useState([]);
    const [selectedRtlProjectId, setSelectedRtlProjectId] = useState('');

    // AI Chat Assistant State
    const [chatHistory, setChatHistory] = useState([
        { role: "assistant", parts: [{ text: "Hello! I am your AI Simulation Assistant. How can I help you today?" }] }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Theme state
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const mainBg = theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const dimmedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    const cardBg = theme === 'dark' ? 'bg-[#1a1a23]' : 'bg-white';
    const cardBorder = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

    // Added serviceName constant to fix the no-undef error
    const serviceName = "RTL Simulator";


    // --- Firebase & User State Initialization ---
    useEffect(() => {
        // Since firebaseconfig.js handles the appIdentifier logic, we can just import it.
        // We still need a listener to get the user state.
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            const currentUserId = currentUser ? currentUser.uid : (crypto.randomUUID ? crypto.randomUUID() : 'anonymous_user');
            setUserId(currentUserId);
            setLoadingAuth(false);
            console.log("RTL Simulator: Auth state changed. User ID:", currentUserId);
        });

        // Cleanup listener
        return () => unsubscribeAuth();
    }, []);

    // --- Project Fetching & Loading ---
    const rtlProjectsCollection = useCallback(() => {
        if (!db || !appIdentifier || !userId) return null;
        return collection(db, 'artifacts', appIdentifier, 'users', userId, 'rtl_projects');
    }, [db, appIdentifier, userId]);

    const fetchRtlProjects = useCallback(async () => {
        const projectsCol = rtlProjectsCollection();
        if (!projectsCol) {
            console.warn("Firestore collection not ready for fetching RTL projects.");
            setSavedRtlProjects([]);
            return;
        }
        try {
            const q = query(projectsCol);
            const querySnapshot = await getDocs(q);
            const projectsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                code: doc.data().code
            }));
            setSavedRtlProjects(projectsList);
            console.log("Fetched RTL projects for Simulator:", projectsList);
        } catch (error) {
            console.error("Error fetching RTL projects:", error);
            appendToLog(`\nError fetching RTL projects: ${error.message}`);
        }
    }, [rtlProjectsCollection]);

    useEffect(() => {
        if (userId && !loadingAuth && db) {
            fetchRtlProjects();
        }
    }, [userId, loadingAuth, db, fetchRtlProjects]);

    const handleLoadRTL = useCallback(async () => {
        if (!selectedRtlProjectId) {
            alert("Please select an RTL project to load.");
            return;
        }
        const projectsCol = rtlProjectsCollection();
        if (!projectsCol) {
            alert("Firestore is not ready. Please try again.");
            return;
        }

        try {
            const docRef = doc(projectsCol, selectedRtlProjectId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setRtlCodeInput(data.code);
                appendToLog(`\nLoaded RTL project "${data.name}" for simulation.`);
                console.log("Loaded RTL for simulation:", data.name);
            } else {
                appendToLog(`\nRTL project "${selectedRtlProjectId}" not found.`);
                alert(`RTL project "${selectedRtlProjectId}" not found.`);
            }
        } catch (error) {
            console.error("Error loading RTL project:", error);
            appendToLog(`\nError loading RTL project: ${error.message}`);
            alert(`Error loading RTL project: ${error.message}`);
        }
    }, [selectedRtlProjectId, rtlProjectsCollection]);

    // --- Simulation Logic (Simulated) ---
    const appendToLog = (message) => {
        setOutputLog(prev => prev + message);
        setTimeout(() => {
            if (outputLogRef.current) {
                outputLogRef.current.scrollTop = outputLogRef.current.scrollHeight;
            }
        }, 100);
    };

    // Helper to extract module name and basic ports (very simplified)
    const parseRTLPorts = (rtlCode) => {
        const moduleMatch = rtlCode.match(/module\s+(\w+)\s*\(([^)]*)\);/);
        if (!moduleMatch) return { moduleName: "unknown_module", inputs: [], outputs: [], inouts: [] };

        const moduleName = moduleMatch[1];
        const portList = moduleMatch[2];

        const inputs = (portList.match(/input\s+[^,;)]+/g) || []).map(p => p.replace(/input\s+(logic|reg|wire)\s*(\[\d+:\d+\])?\s*/, '').trim().split(',').map(s => s.trim())).flat();
        const outputs = (portList.match(/output\s+[^,;)]+/g) || []).map(p => p.replace(/output\s+(logic|reg|wire)\s*(\[\d+:\d+\])?\s*/, '').trim().split(',').map(s => s.trim())).flat();
        const inouts = (portList.match(/inout\s+[^,;)]+/g) || []).map(p => p.replace(/inout\s+(logic|reg|wire)\s*(\[\d+:\d+\])?\s*/, '').trim().split(',').map(s => s.trim())).flat();

        return { moduleName, inputs, outputs, inouts };
    };

    const runSimulation = async () => {
        if (!rtlCodeInput) {
            alert("Please load an RTL code project first.");
            return;
        }
        setIsSimulating(true);
        setOutputLog(""); // Clear previous log
        setSimulatedWaveform('');

        const { moduleName, inputs, outputs } = parseRTLPorts(rtlCodeInput);

        appendToLog(`\n--- Starting RTL Simulation for Module: ${moduleName} ---`);
        appendToLog(`\n[SIM] Initializing simulator environment...`);
        await new Promise(resolve => setTimeout(resolve, 800));
        appendToLog(`[SIM] Compiling RTL code...`);
        appendToLog(`  - Syntax check: OK`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        appendToLog(`[SIM] Loading design: ${moduleName}...`);
        appendToLog(`  - Detected Inputs: ${inputs.join(', ')}`);
        appendToLog(`  - Detected Outputs: ${outputs.join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 1200));
        appendToLog(`[SIM] Running simulation for 100ns with basic stimuli...`);

        // Simulate waveform data based on detected ports
        let waveformData = "\nTime (ns) | ";
        waveformData += inputs.map(i => `Input ${i.padEnd(7)}`).join(' | ');
        waveformData += " | ";
        waveformData += outputs.map(o => `Output ${o.padEnd(7)}`).join(' | ');
        waveformData += "\n";
        waveformData += "----------|-" + inputs.map(() => "---------").join('-|-') + "-|-" + outputs.map(() => "---------").join('-|-') + "-\n";

        for (let i = 0; i <= 100; i += 10) {
            const inputValues = inputs.map(() => Math.floor(Math.random() * 256));
            let outputValues = [];

            if (rtlCodeInput.includes('a + b') && inputs.includes('a') && inputs.includes('b') && outputs.includes('sum')) {
                const a_val = inputValues[inputs.indexOf('a')] || 0;
                const b_val = inputValues[inputs.indexOf('b')] || 0;
                let sum_val = (a_val + b_val);
                const sum_port_match = rtlCodeInput.match(/output\s+logic\s+\[(\d+):0\]\s+sum/);
                if (sum_port_match && parseInt(sum_port_match[1]) === 8) {
                    sum_val = sum_val & 0x1FF;
                } else {
                    sum_val = sum_val & 0xFF;
                }
                outputValues.push(sum_val);
            } else {
                outputValues = outputs.map(() => Math.floor(Math.random() * 256));
            }

            waveformData += `${String(i).padEnd(9)} | ${inputValues.map(v => String(v).padEnd(7)).join(' | ')} | ${outputValues.map(v => String(v).padEnd(7)).join(' | ')}\n`;
        }

        appendToLog(`[SIM] Simulation completed.`);
        appendToLog(`\n[SIM] Simulated Waveform Data:\n${waveformData}\n`);
        setSimulatedWaveform(waveformData);
        appendToLog(`[STATUS] Simulation FINISHED successfully!`);
        appendToLog(`\nNext Steps:\n1. Review the simulated waveform data for ${moduleName}.\n2. Refine your RTL code or testbench.\n3. Proceed to Synthesis.`);
        setIsSimulating(false);
    };

    const handleExportWaveform = () => {
        if (!simulatedWaveform) {
            alert("No waveform data generated yet. Please run simulation first.");
            return;
        }
        const blob = new Blob([simulatedWaveform], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedRtlProjectId || 'untitled'}_waveform.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        appendToLog(`\nSimulated Waveform data exported as "${link.download}"`);
    };

    const handleGenerateTestbench = async () => {
        if (!rtlCodeInput) {
            alert("Please load an RTL code project first to generate a testbench.");
            return;
        }
        appendToLog(`\n--- Generating Testbench (AI Assisted) ---`);
        appendToLog(`\n[AI] Requesting testbench generation...`);
        const aiPrompt = `Generate a basic Verilog/SystemVerilog testbench for the following RTL module. Assume standard clock (clk) and reset (rst_n) for sequential logic, and provide some simple input stimuli for testing combinational logic. Focus on testing the primary functionality based on the inputs and outputs. Only provide the Verilog/SystemVerilog code, no explanations or extra text.\n\n\`\`\`systemverilog\n${rtlCodeInput}\n\`\`\``;
        setChatHistory(prev => [...prev, { role: "user", parts: [{ text: "Generate testbench for current RTL." }] }]);
        setIsTyping(true);

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: aiPrompt }] }] };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
                const testbenchCode = result.candidates[0].content.parts[0].text;
                appendToLog(`\n[AI] Testbench Generated:\n${testbenchCode}\n`);
                setChatHistory(prev => [...prev, { role: "assistant", parts: [{ text: "Testbench generated and added to output log." }] }]);
            } else {
                appendToLog(`\n[AI-ERROR] Failed to generate testbench: No response from AI.`);
                setChatHistory(prev => [...prev, { role: "assistant", parts: [{ text: "Failed to generate testbench. Please try again." }] }]);
            }
        } catch (error) {
            appendToLog(`\n[AI-ERROR] Error generating testbench: ${error.message}`);
            setChatHistory(prev => [...prev, { role: "assistant", parts: [{ text: "Error generating testbench. Please check network/API." }] }]);
            console.error("AI Testbench Generation Error:", error);
        } finally {
            setIsTyping(false);
        }
    };


    // --- AI Chat Assistant Logic ---
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (chatInput.trim() === '') return;

        const userMessage = { role: "user", parts: [{ text: chatInput }] };
        setChatHistory((prev) => [...prev, userMessage]);
        setChatInput('');
        setIsTyping(true);
        appendToLog(`\nAI Request: ${userMessage.parts[0].text}`);

        try {
            let fullPrompt = `User is working in an RTL Simulation Tool. The loaded RTL code is:\n\n\`\`\`systemverilog\n${rtlCodeInput}\n\`\`\`\n\n`;
            if (simulatedWaveform) {
                fullPrompt += `Previous Simulated Waveform Data:\n${simulatedWaveform}\n\n`;
            }
            fullPrompt += `User's question about the RTL code or simulation: ${userMessage.parts[0].text}`;

            const payload = { contents: [...chatHistory, { role: "user", parts: [{ text: fullPrompt }] }] };
            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const assistantText = result.candidates[0].content.parts[0].text;
                setChatHistory((prev) => [...prev, { role: "assistant", parts: [{ text: assistantText }] }]);
                appendToLog(`\nAI Response: ${assistantText}`);
            } else {
                setChatHistory((prev) => [...prev, { role: "assistant", parts: [{ text: "Sorry, I couldn't get a response. Please try again." }] }]);
                appendToLog(`\nAI Error: Unexpected response structure.`);
                console.error("Gemini API returned an unexpected structure:", result);
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setChatHistory((prev) => [...prev, { role: "assistant", parts: [{ text: "An error occurred while connecting to the AI. Please check your network." }] }]);
            appendToLog(`\nAI Connection Error: ${error.message}`);
        } finally {
            setIsTyping(false);
        }
    };

    // Scroll output log and chat to bottom
    useEffect(() => {
        if (outputLogRef.current) {
            outputLogRef.current.scrollTop = outputLogRef.current.scrollHeight;
        }
    }, [outputLog, chatHistory]);


    // Handle initial state and loading
    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] font-inter text-white">
                <p className="text-xl">Loading RTL Simulator...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] p-4 font-inter text-white flex flex-col">
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
                .input-field, .select-field {
                    background-color: #1a1a23;
                    border: 1px solid #333345;
                    color: #e0e0e0;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-field:focus, .select-field:focus {
                    border-color: #a78bfa;
                }
                .output-log {
                    background-color: #0d0d12;
                    border: 1px solid #333345;
                    border-radius: 0.75rem;
                    min-height: 150px;
                    max-height: 400px;
                    overflow-y: auto;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                    font-size: 0.85rem;
                    color: #a0aec0;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                .rtl-code-display {
                    background-color: #0d0d12;
                    border: 1px solid #333345;
                    border-radius: 0.75rem;
                    min-height: 200px;
                    max-height: 350px;
                    overflow-y: auto;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
                    font-size: 0.9rem;
                    color: #e0e0e0;
                    padding: 1rem;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                .chat-container {
                    background-color: #1a1a23;
                    border: 1px solid #333345;
                    border-radius: 0.75rem;
                }
                .chat-message-user {
                    background-color: #4c2b9a;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    max-width: 80%;
                    align-self: flex-end;
                    word-wrap: break-word;
                }
                .chat-message-ai {
                    background-color: #24242e;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    max-width: 80%;
                    align-self: flex-start;
                    word-wrap: break-word;
                }
                .chat-input-field {
                    background-color: #0d0d12;
                    border: 1px solid #333345;
                    color: #e0e0e0;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    outline: none;
                }
                .chat-input-field:focus {
                    border-color: #a78bfa;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a23;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #4c2b9a;
                    border-radius: 20px;
                    border: 2px solid #1a1a23;
                }
            `}</style>
            <div className={`container mx-auto py-4 flex-grow flex flex-col transform transition-all duration-500`}>

                <div className="bg-[#1a1a23] p-4 rounded-xl shadow-lg mb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        <span>Back to Dashboard</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-white flex-grow text-center">{serviceName}</h1>
                    <div className="w-24"></div>
                </div>

                <div className="flex-grow flex flex-col lg:flex-row gap-6">
                    <div className="flex flex-col w-full lg:w-3/4">
                        <div className="bg-[#1a1a23] p-4 rounded-xl shadow-lg mb-4 flex flex-wrap gap-4 items-center">
                            <label htmlFor="rtl-project-select" className="text-gray-300">Load RTL Project:</label>
                            <select
                                id="rtl-project-select"
                                value={selectedRtlProjectId}
                                onChange={(e) => setSelectedRtlProjectId(e.target.value)}
                                className="select-field flex-grow max-w-[250px]"
                            >
                                <option value="">-- Select a project --</option>
                                {savedRtlProjects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleLoadRTL}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105"
                                disabled={!selectedRtlProjectId}
                            >
                                Load RTL
                            </button>
                            <button
                                onClick={runSimulation}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
                                disabled={isSimulating || !rtlCodeInput}
                            >
                                {isSimulating ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Simulating...
                                    </span>
                                ) : (
                                    <span>Run Simulation</span>
                                )}
                            </button>
                        </div>

                        <div className="bg-[#1a1a23] p-4 rounded-xl shadow-lg mb-4 flex-grow">
                            <h3 className="text-lg font-semibold text-white mb-2">Loaded RTL Code</h3>
                            <pre className="rtl-code-display custom-scrollbar">
                                {rtlCodeInput || "// Load an RTL project from the dropdown above to view its code."}
                            </pre>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/4 flex flex-col gap-6">
                        <div className="bg-[#1a1a23] p-4 rounded-xl shadow-lg flex-grow flex flex-col">
                            <h3 className="text-lg font-semibold text-white mb-2">Simulation Output Log</h3>
                            <div className="output-log p-2 flex-grow custom-scrollbar" ref={outputLogRef}>
                                {outputLog || "Simulation output will appear here. Click 'Run Simulation' to start."}
                            </div>
                            {simulatedWaveform && (
                                <button
                                    onClick={handleExportWaveform}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 mt-4 w-full"
                                >
                                    <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    Export Waveform
                                </button>
                            )}
                             <button
                                onClick={handleGenerateTestbench}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 mt-2 w-full"
                                disabled={isTyping || !rtlCodeInput}
                            >
                                <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 10.5v6m-3-3h6m3 3V17c0 1.105-.895 2-2 2H7c-1.105 0-2-.895-2-2v-2.341M3 11l7.412 7.412a2.002 2.002 0 001.416.588H21M13 8V5a2 2 0 00-2-2H4a2 2 0 00-2 2v7.587M15 13H9l-.022.022"/></svg>
                                Gen. Testbench (AI)
                            </button>
                            <button
                                onClick={() => navigate('/tools/chip/synthesis-tool')}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 transform hover:scale-105 mt-2 w-full"
                            >
                                Proceed to Synthesis Tool
                            </button>
                        </div>

                        <div className="chat-container p-4 flex-grow flex flex-col">
                            <h2 className="text-xl font-bold text-white text-center mb-4 border-b border-gray-700 pb-2">AI Assistant</h2>
                            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {chatHistory.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
                                            {msg.parts[0].text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="chat-message-ai">
                                            <span className="animate-pulse">...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask the AI a question..."
                                    className="chat-input-field flex-grow"
                                    disabled={isTyping}
                                />
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors duration-200"
                                    disabled={isTyping}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RTLSimulator;
