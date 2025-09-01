// src/pages/tools/SchematicEditorPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    FaPlus, FaSave, FaFolderOpen, FaTrash, FaMousePointer, FaSquare, FaCircle, FaMicrochip, FaBezierCurve, FaHome
} from 'react-icons/fa';

import {
    initializeApp
} from 'firebase/app';
import {
    getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore, collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit
} from 'firebase/firestore';

function SchematicEditorPage() {
    // Firebase State
    const [firebaseApp, setFirebaseApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    // Schematic Tool State
    const canvasRef = useRef(null);
    const [components, setComponents] = useState([]); // { id, type, x, y, value, pins: [{x,y,connectedTo:[]}] }
    const [wires, setWires] = useState([]); // { id, points: [{x,y}], connectedPins: [{comp_id, pin_id}] }
    const [selectedElement, setSelectedElement] = useState(null); // { type: 'component'|'wire', id: '...' }
    const [drawingMode, setDrawingMode] = useState(null); // 'component_resistor', 'component_capacitor', 'component_ic', 'wire'
    const [tempWirePoints, setTempWirePoints] = useState([]); // For drawing new wires
    const [message, setMessage] = useState(''); // User feedback messages
    const [isProjectListOpen, setIsProjectListOpen] = useState(false);
    const [userProjects, setUserProjects] = useState([]);
    const [currentProjectName, setCurrentProjectName] = useState('Untitled Schematic');
    const [currentProjectId, setCurrentProjectId] = useState(null);

    // Constants for drawing
    const COMPONENT_SIZE = 60;
    const WIRE_NODE_RADIUS = 4;
    const GRID_SIZE = 20;

    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        try {
            // Safely access global variables using window object
            const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config 
                ? JSON.parse(window.__firebase_config) 
                : {};
            const initialAuthToken = typeof window !== 'undefined' && window.__initial_auth_token 
                ? window.__initial_auth_token 
                : null;
            const appId = typeof window !== 'undefined' && window.__app_id 
                ? window.__app_id 
                : 'default-app-id';

            if (!firebaseConfig.apiKey) {
                console.error("Firebase config is missing. Please ensure __firebase_config is correctly set.");
                setMessage("Firebase not configured. Data persistence will not work.");
                return;
            }

            const appInstance = initializeApp(firebaseConfig, appId);
            const authInstance = getAuth(appInstance);
            const dbInstance = getFirestore(appInstance);

            setFirebaseApp(appInstance);
            setAuth(authInstance);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setAuthReady(true);
                    console.log("Firebase: User signed in:", user.uid);
                    setMessage("Logged in. Ready to load/save projects.");
                } else {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(authInstance, initialAuthToken);
                            console.log("Firebase: Signed in with custom token.");
                        } else {
                            await signInAnonymously(authInstance);
                            console.log("Firebase: Signed in anonymously.");
                        }
                    } catch (error) {
                        console.error("Firebase: Auth error:", error);
                        setMessage("Failed to authenticate. Data persistence may not work.");
                    }
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            setMessage("Firebase initialization failed.");
        }
    }, []);

    // --- Drawing on Canvas ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#333345';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= rect.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, rect.height);
            ctx.stroke();
        }
        for (let y = 0; y <= rect.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(rect.width, y);
            ctx.stroke();
        }

        // Draw components
        components.forEach(comp => {
            const isSelected = selectedElement?.type === 'component' && selectedElement?.id === comp.id;
            ctx.fillStyle = isSelected ? '#a78bfa' : '#6b7280'; // Highlight if selected
            ctx.strokeStyle = isSelected ? '#fff' : '#ccc';
            ctx.lineWidth = 1;

            let x = comp.x;
            let y = comp.y;
            let width = comp.width || COMPONENT_SIZE;
            let height = comp.height || COMPONENT_SIZE;

            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = '#fff';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${comp.type.toUpperCase().substring(0, 3)}${comp.id.replace('comp', '')}`, x + width / 2, y + height / 2 - 8);
            ctx.font = '10px Inter';
            ctx.fillText(comp.value || '', x + width / 2, y + height / 2 + 8);

            // Draw pins (simplified: 2 pins per component, left and right middle)
            // Storing pin coordinates directly in component for easier lookup during wire drawing/connections
            comp.pins = [
                { id: `${comp.id}_p1`, x: x, y: y + height / 2 },
                { id: `${comp.id}_p2`, x: x + width, y: y + height / 2 }
            ];

            comp.pins.forEach(pin => {
                ctx.beginPath();
                ctx.arc(pin.x, pin.y, WIRE_NODE_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = '#0f0';
                ctx.fill();
                ctx.strokeStyle = '#0a0';
                ctx.stroke();
            });
        });

        // Draw wires
        wires.forEach(wire => {
            if (wire.points.length < 2) return;
            const isSelected = selectedElement?.type === 'wire' && selectedElement?.id === wire.id;
            ctx.strokeStyle = isSelected ? '#a78bfa' : '#00f'; // Highlight if selected
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(wire.points[0].x, wire.points[0].y);
            for (let i = 1; i < wire.points.length; i++) {
                ctx.lineTo(wire.points[i].x, wire.points[i].y);
            }
            ctx.stroke();

            // Draw connection dots at intermediate points
            wire.points.forEach((p, index) => {
                if (index > 0 && index < wire.points.length - 1) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, WIRE_NODE_RADIUS / 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#00f';
                    ctx.fill();
                }
            });
        });

        // Draw temporary wire while drawing
        if (drawingMode === 'wire' && tempWirePoints.length > 0) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tempWirePoints[0].x, tempWirePoints[0].y);
            for (let i = 1; i < tempWirePoints.length; i++) {
                ctx.lineTo(tempWirePoints[i].x, tempWirePoints[i].y);
            }
            ctx.stroke();
        }
    }, [components, wires, selectedElement, drawingMode, tempWirePoints]);

    useEffect(() => {
        draw();
    }, [draw]);

    // Handle canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        const observer = new ResizeObserver(draw);
        if (canvas) {
            observer.observe(canvas);
        }
        return () => {
            if (canvas) {
                observer.unobserve(canvas);
            }
        };
    }, [draw]);

    // --- Interaction Handlers ---
    const getNearestGridPoint = (x, y) => {
        return {
            x: Math.round(x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(y / GRID_SIZE) * GRID_SIZE
        };
    };

    const findClickedElement = (x, y) => {
        // Check components
        for (let i = components.length - 1; i >= 0; i--) {
            const comp = components[i];
            const width = comp.width || COMPONENT_SIZE;
            const height = comp.height || COMPONENT_SIZE;
            if (x >= comp.x && x <= comp.x + width &&
                y >= comp.y && y <= comp.y + height) {
                return { type: 'component', id: comp.id };
            }
        }
        // Check wires (simplified: check if near any point)
        for (let i = wires.length - 1; i >= 0; i--) {
            const wire = wires[i];
            for (let j = 0; j < wire.points.length - 1; j++) {
                const p1 = wire.points[j];
                const p2 = wire.points[j + 1];
                // Check if point (x,y) is near line segment (p1, p2)
                const dist = Math.abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x) /
                             Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
                if (dist < 5) { // within 5 pixels of the line
                    // Further check if point is within bounds of the segment (simplistic)
                    const minX = Math.min(p1.x, p2.x);
                    const maxX = Math.max(p1.x, p2.x);
                    const minY = Math.min(p1.y, p2.y);
                    const maxY = Math.max(p1.y, p2.y);
                    if (x >= minX - 5 && x <= maxX + 5 && y >= minY - 5 && y <= maxY + 5) {
                        return { type: 'wire', id: wire.id };
                    }
                }
            }
        }
        return null;
    };

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const snappedPoint = getNearestGridPoint(mouseX, mouseY);

        if (drawingMode && drawingMode.startsWith('component_')) {
            const newComp = {
                id: `comp${Date.now()}`,
                type: drawingMode.replace('component_', ''),
                x: snappedPoint.x,
                y: snappedPoint.y,
                width: COMPONENT_SIZE,
                height: COMPONENT_SIZE,
                value: drawingMode === 'component_resistor' ? '1k' : drawingMode === 'component_capacitor' ? '100nF' : 'IC',
                pins: [] // Pins will be dynamically populated in draw function
            };
            setComponents(prev => [...prev, newComp]);
            setDrawingMode(null); // Exit drawing mode after placement
            setMessage(`Placed ${newComp.type.toUpperCase()}`);
            setSelectedElement({ type: 'component', id: newComp.id });
        } else if (drawingMode === 'wire') {
            if (tempWirePoints.length === 0) {
                setTempWirePoints([snappedPoint]); // Start wire
            } else {
                setTempWirePoints(prev => [...prev, snappedPoint]); // Add segment
            }
            draw(); // Redraw immediately for visual feedback
        } else {
            // Selection mode
            const clicked = findClickedElement(mouseX, mouseY);
            setSelectedElement(clicked);
        }
    };

    const handleMouseMove = (e) => {
        if (drawingMode === 'wire' && tempWirePoints.length > 0) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const snappedPoint = getNearestGridPoint(mouseX, mouseY);

            setTempWirePoints(prev => {
                const newPoints = [...prev];
                // Update the last point of the temporary wire
                if (newPoints.length > 0) {
                    newPoints[newPoints.length - 1] = snappedPoint;
                }
                return newPoints;
            });
            draw(); // Redraw to show dynamic wire
        }
    };

    const handleMouseUp = (e) => {
        if (drawingMode === 'wire') {
            if (tempWirePoints.length > 1) { // A wire needs at least 2 points (1 segment)
                const newWire = {
                    id: `wire${Date.now()}`,
                    points: tempWirePoints,
                    connectedPins: [] // More complex logic needed to connect to actual component pins
                };
                setWires(prev => [...prev, newWire]);
                setMessage('Wire drawn.');
                setSelectedElement({ type: 'wire', id: newWire.id });
            } else {
                setMessage('Wire cancelled: too few points.');
            }
            setTempWirePoints([]); // Clear temporary points
            setDrawingMode(null); // Exit drawing mode
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault(); // Prevent default right-click menu
        if (drawingMode === 'wire' && tempWirePoints.length > 0) {
            handleMouseUp(e); // Finalize wire on right-click
        }
    };

    // Keyboard 'Escape' to cancel drawing mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setDrawingMode(null);
                setTempWirePoints([]);
                setMessage('');
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedElement) {
                    if (selectedElement.type === 'component') {
                        setComponents(prev => prev.filter(c => c.id !== selectedElement.id));
                        // Also remove any wires connected to this component (simplified check)
                        setWires(prev => prev.filter(w => !w.points.some(p => p.connectedTo && p.connectedTo.includes(selectedElement.id))));
                    } else if (selectedElement.type === 'wire') {
                        setWires(prev => prev.filter(w => w.id !== selectedElement.id));
                    }
                    setSelectedElement(null);
                    setMessage(`Deleted ${selectedElement.type}.`);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, setComponents, setWires, setSelectedElement]);

    // --- Project Management (Firebase) ---
    const getSchematicProjectsCollection = useCallback(() => {
        if (!db || !userId) {
            console.error("Firestore not ready or user not authenticated.");
            setMessage("Error: Database not ready or user not authenticated.");
            return null;
        }
        // Use the Firestore security rules compliant path
        // Safely access global variable using window object
        const appId = typeof window !== 'undefined' && window.__app_id 
            ? window.__app_id 
            : 'default-app-id';
        return collection(db, `artifacts/${appId}/users/${userId}/schematic_projects`);
    }, [db, userId]);

    const loadUserProjects = useCallback(async () => {
        if (!authReady || !db || !userId) {
            setMessage("Authentication not ready. Cannot load projects.");
            return;
        }
        const projectsCollection = getSchematicProjectsCollection();
        if (!projectsCollection) return;

        setMessage("Loading projects...");
        try {
            const q = query(projectsCollection, orderBy("updatedAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            const loadedProjects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to Date objects if needed for display
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
            }));
            setUserProjects(loadedProjects);
            setMessage(`Loaded ${loadedProjects.length} projects.`);
        } catch (e) {
            console.error("Error loading documents: ", e);
            setMessage("Failed to load projects.");
        }
    }, [authReady, db, userId, getSchematicProjectsCollection]);

    useEffect(() => {
        if (authReady) {
            loadUserProjects();
        }
    }, [authReady, loadUserProjects]);

    const handleNewProject = () => {
        if (!userId) {
            setMessage("Please wait for authentication to complete before creating a new project.");
            return;
        }
        setComponents([]);
        setWires([]);
        setSelectedElement(null);
        setTempWirePoints([]);
        setCurrentProjectName('Untitled Schematic');
        setCurrentProjectId(null);
        setMessage("New schematic project created.");
    };

    const handleSaveProject = async () => {
        if (!authReady || !db || !userId) {
            setMessage("Authentication not ready. Cannot save project.");
            return;
        }
        const projectsCollection = getSchematicProjectsCollection();
        if (!projectsCollection) return;

        setMessage("Saving project...");
        const projectData = {
            name: currentProjectName,
            components: components.map(({ pins, ...rest }) => rest), // Don't save dynamic pins
            wires: wires,
            createdAt: currentProjectId ? userProjects.find(p => p.id === currentProjectId)?.createdAt || new Date() : new Date(),
            updatedAt: new Date(),
            userId: userId
        };

        try {
            if (currentProjectId) {
                await setDoc(doc(projectsCollection, currentProjectId), projectData);
                setMessage(`Project "${currentProjectName}" updated successfully!`);
            } else {
                const docRef = await addDoc(projectsCollection, projectData);
                setCurrentProjectId(docRef.id);
                setMessage(`Project "${currentProjectName}" saved successfully!`);
            }
            loadUserProjects(); // Reload list to update timestamps
        } catch (e) {
            console.error("Error saving document: ", e);
            setMessage(`Failed to save project: ${e.message}`);
        }
    };

    const handleLoadProject = async (projectId) => {
        if (!authReady || !db || !userId) {
            setMessage("Authentication not ready. Cannot load project.");
            return;
        }
        const projectsCollection = getSchematicProjectsCollection();
        if (!projectsCollection) return;

        setMessage("Loading project...");
        try {
            const projectToLoad = userProjects.find(p => p.id === projectId);
            if (projectToLoad) {
                setComponents(projectToLoad.components || []);
                setWires(projectToLoad.wires || []);
                setCurrentProjectName(projectToLoad.name);
                setCurrentProjectId(projectToLoad.id);
                setSelectedElement(null);
                setTempWirePoints([]);
                setMessage(`Project "${projectToLoad.name}" loaded.`);
                setIsProjectListOpen(false);
            } else {
                setMessage("Project not found in your list.");
            }
        } catch (e) {
            console.error("Error loading project data: ", e);
            setMessage("Failed to load project data.");
        }
    };

    const handleDeleteProject = async (projectIdToDelete) => {
        // Use a custom modal or message box instead of window.confirm
        setMessage("Confirm deletion: Are you sure you want to delete this project? (Cannot be undone)");
        // For simplicity, we'll use a direct deletion here. In a real app, you'd show a modal
        if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            setMessage(""); // Clear confirmation message if canceled
            return;
        }

        if (!authReady || !db || !userId) {
            setMessage("Authentication not ready. Cannot delete project.");
            return;
        }
        const projectsCollection = getSchematicProjectsCollection();
        if (!projectsCollection) return;

        setMessage("Deleting project...");
        try {
            await deleteDoc(doc(projectsCollection, projectIdToDelete));
            setMessage("Project deleted successfully!");
            if (currentProjectId === projectIdToDelete) {
                handleNewProject(); // Clear current workspace if deleted
            }
            loadUserProjects(); // Reload list
        } catch (e) {
            console.error("Error deleting document: ", e);
            setMessage(`Failed to delete project: ${e.message}`);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d0d12] to-[#1a1a23] text-white font-inter flex flex-col">
            {/* Header */}
            <header className="bg-[#12121c] p-4 shadow-lg flex justify-between items-center z-20">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                        EDA-Pro
                    </Link>
                    <span className="text-gray-400">/ Schematic Editor</span>
                </div>
                <h1 className="text-xl font-semibold text-white truncate max-w-[300px] md:max-w-none">
                    Current Project: {currentProjectName}
                </h1>
                <Link to="/services" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                    <FaHome /> <span>Back to Services</span>
                </Link>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolbar */}
                <aside className="w-64 bg-[#1a1a23] p-4 border-r border-gray-700 flex flex-col space-y-4 shadow-xl">
                    <h2 className="text-xl font-bold text-teal-400 mb-2">Tools</h2>
                    <button
                        onClick={handleNewProject}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <FaPlus /> <span>New Project</span>
                    </button>
                    <button
                        onClick={handleSaveProject}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
                        disabled={!authReady}
                    >
                        <FaSave /> <span>Save Project</span>
                    </button>
                    <button
                        onClick={() => { setIsProjectListOpen(true); loadUserProjects(); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
                        disabled={!authReady}
                    >
                        <FaFolderOpen /> <span>Open Project</span>
                    </button>

                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Components</h3>
                        <button
                            onClick={() => { setDrawingMode('component_resistor'); setMessage('Click on canvas to place Resistor (R)'); }}
                            className={`w-full text-left py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors ${drawingMode === 'component_resistor' ? 'bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <FaSquare /> <span>Resistor (R)</span>
                        </button>
                        <button
                            onClick={() => { setDrawingMode('component_capacitor'); setMessage('Click on canvas to place Capacitor (C)'); }}
                            className={`w-full text-left mt-2 py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors ${drawingMode === 'component_capacitor' ? 'bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <FaCircle /> <span>Capacitor (C)</span>
                        </button>
                        <button
                            onClick={() => { setDrawingMode('component_ic'); setMessage('Click on canvas to place IC (U)'); }}
                            className={`w-full text-left mt-2 py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors ${drawingMode === 'component_ic' ? 'bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <FaMicrochip /> <span>IC (U)</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Wiring</h3>
                        <button
                            onClick={() => { setDrawingMode('wire'); setMessage('Click to start wire, click to add bends, right-click/Esc to finish'); }}
                            className={`w-full text-left py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors ${drawingMode === 'wire' ? 'bg-teal-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <FaBezierCurve /> <span>Draw Wire</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Actions</h3>
                        <button
                            onClick={() => setSelectedElement(null)}
                            className={`w-full text-left py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors ${!selectedElement ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <FaMousePointer /> <span>Select Tool</span>
                        </button>
                        {selectedElement && (
                            <button
                                onClick={() => {
                                    if (selectedElement.type === 'component') {
                                        setComponents(prev => prev.filter(c => c.id !== selectedElement.id));
                                        // Simple wire cleanup: remove wires whose points are very close to component pins
                                        const deletedComp = components.find(c => c.id === selectedElement.id);
                                        if (deletedComp) {
                                            const affectedWires = new Set();
                                            wires.forEach(wire => {
                                                wire.points.forEach(point => {
                                                    deletedComp.pins.forEach(pin => {
                                                        const dist = Math.sqrt(Math.pow(point.x - pin.x, 2) + Math.pow(point.y - pin.y, 2));
                                                        if (dist < WIRE_NODE_RADIUS * 2) { // if point is near a deleted component's pin
                                                            affectedWires.add(wire.id);
                                                        }
                                                    });
                                                });
                                            });
                                            setWires(prev => prev.filter(w => !affectedWires.has(w.id)));
                                        }
                                    } else if (selectedElement.type === 'wire') {
                                        setWires(prev => prev.filter(w => w.id !== selectedElement.id));
                                    }
                                    setSelectedElement(null);
                                    setMessage(`Deleted ${selectedElement.type}.`);
                                }}
                                className="w-full text-left mt-2 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2 transition-colors"
                            >
                                <FaTrash /> <span>Delete Selected</span>
                            </button>
                        )}
                    </div>
                </aside>

                {/* Canvas Area */}
                <div className="flex-1 p-4 flex flex-col">
                    <div className="bg-[#1a1a23] p-2 rounded-lg shadow-md mb-4 text-center text-sm text-gray-300">
                        {message || "Welcome to Schematic Editor. Select a tool from the left."}
                    </div>
                    <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onContextMenu={handleContextMenu} // Right-click to finish wire
                        ></canvas>
                    </div>
                </div>

                {/* Right Panel - Properties / Selected Element */}
                <aside className="w-64 bg-[#1a1a23] p-4 border-l border-gray-700 flex flex-col shadow-xl">
                    <h2 className="text-xl font-bold text-teal-400 mb-4">Properties</h2>
                    {selectedElement ? (
                        <div className="space-y-3">
                            {selectedElement.type === 'component' && (
                                <>
                                    <p className="text-gray-300">Type: <span className="font-semibold">{components.find(c => c.id === selectedElement.id)?.type || 'N/A'}</span></p>
                                    <p className="text-gray-300">ID: <span className="font-semibold">{selectedElement.id}</span></p>
                                    <p className="text-gray-300">X: <span className="font-semibold">{components.find(c => c.id === selectedElement.id)?.x}</span></p>
                                    <p className="text-gray-300">Y: <span className="font-semibold">{components.find(c => c.id === selectedElement.id)?.y}</span></p>
                                    <label htmlFor="compValue" className="block text-gray-400 text-sm">Value:</label>
                                    <input
                                        type="text"
                                        id="compValue"
                                        className="input-field w-full"
                                        value={components.find(c => c.id === selectedElement.id)?.value || ''}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setComponents(prev => prev.map(c =>
                                                c.id === selectedElement.id ? { ...c, value: newValue } : c
                                            ));
                                        }}
                                    />
                                </>
                            )}
                            {selectedElement.type === 'wire' && (
                                <>
                                    <p className="text-gray-300">Type: <span className="font-semibold">Wire</span></p>
                                    <p className="text-gray-300">ID: <span className="font-semibold">{selectedElement.id}</span></p>
                                    <p className="text-gray-300">Segments: <span className="font-semibold">{wires.find(t => t.id === selectedElement.id)?.points.length - 1}</span></p>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">Select an element on the canvas to view/edit properties.</p>
                    )}
                </aside>
            </div>

            {/* Project List Modal */}
            <AnimatePresence>
                {isProjectListOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-[#1a1a23] rounded-lg shadow-2xl p-8 w-full max-w-lg border border-gray-700"
                        >
                            <h2 className="text-2xl font-bold text-teal-400 mb-6">Your Schematic Projects</h2>
                            {userProjects.length > 0 ? (
                                <ul className="max-h-80 overflow-y-auto space-y-3 pr-2">
                                    {userProjects.map(project => (
                                        <li key={project.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-md border border-gray-700">
                                            <div>
                                                <p className="text-lg font-semibold text-white">{project.name}</p>
                                                <p className="text-gray-500 text-sm">Last updated: {project.updatedAt?.toLocaleString() || 'N/A'}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleLoadProject(project.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProject(project.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400">No projects saved yet. Create a new one!</p>
                            )}
                            <div className="mt-8 text-right">
                                <button
                                    onClick={() => setIsProjectListOpen(false)}
                                    className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-5 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SchematicEditorPage;