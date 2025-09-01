// src/pages/tool/chip/components/WaveformPanel.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWaveSquare, FaArrowRight } from 'react-icons/fa';

/**
 * WaveformPanel Component
 * Displays a simulated waveform viewer using HTML Canvas.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isRightPanelOpen - Whether the right panel is open.
 * @param {function} props.setIsRightPanelOpen - Function to toggle the right panel.
 * @param {string} props.panelBg - Tailwind class for panel background.
 * @param {string} props.borderColor - Tailwind class for border color.
 * @param {string} props.textColor - Tailwind class for text color.
 * @param {string} props.dimmedText - Tailwind class for dimmed text color.
 * @param {string} props.theme - Current theme ('light' or 'dark').
 * @param {Array<object>} props.waveformSignals - Array of signal data for waveform drawing.
 * Example: [{ name: 'clk', values: [0, 1, 0, 1, ...], timestamps: [0, 10, 20, 30, ...] }]
 */
const WaveformPanel = ({ isRightPanelOpen, setIsRightPanelOpen, panelBg, borderColor, textColor, dimmedText, theme, waveformSignals }) => {
    const TOP_NAVBAR_HEIGHT = '56px';
    const RIGHT_PANEL_WIDTH = '350px';
    const canvasRef = useRef(null);

    // Function to draw waveforms on the canvas
    const drawWaveforms = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.warn("Canvas element not available for drawing waveforms.");
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("2D rendering context not available for canvas.");
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas dimensions to match display size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        // Styling
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = dimmedText.replace('text-', '#').replace('gray-400', 'a0aec0').replace('gray-600', '718096');

        const padding = 10;
        const signalHeight = 30; // Height allocated per signal
        const signalLabelWidth = 60; // Width for signal names
        const waveformAreaStartX = signalLabelWidth + padding;

        // Find max timestamp for scaling
        let maxTimestamp = 0;
        waveformSignals.forEach(signal => {
            if (signal.timestamps && signal.timestamps.length > 0) {
                maxTimestamp = Math.max(maxTimestamp, signal.timestamps[signal.timestamps.length - 1]);
            }
        });

        // Calculate horizontal scale
        const drawableWidth = rect.width - waveformAreaStartX - padding;
        const xScale = maxTimestamp > 0 ? drawableWidth / maxTimestamp : 1;

        waveformSignals.forEach((signal, index) => {
            const yOffset = padding + (index * signalHeight);
            const signalMidY = yOffset + (signalHeight / 2);

            // Draw signal name
            ctx.fillText(signal.name, padding, signalMidY + 4);

            // Draw horizontal baseline for the signal
            ctx.strokeStyle = theme === 'dark' ? '#374151' : '#D1D5DB'; // Light gray for baseline
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(waveformAreaStartX, signalMidY);
            ctx.lineTo(rect.width - padding, signalMidY);
            ctx.stroke();

            // Draw waveform for signals
            if (signal.values && signal.timestamps && signal.values.length === signal.timestamps.length) {
                ctx.strokeStyle = theme === 'dark' ? '#8a2be2' : '#6b46c1'; // Purple for waveforms
                ctx.lineWidth = 2; // Default line width

                ctx.beginPath();
                for (let i = 0; i < signal.values.length; i++) {
                    const x = waveformAreaStartX + (signal.timestamps[i] * xScale);
                    const value = signal.values[i];

                    // Determine Y position based on value (for binary-like visualization)
                    // For multi-bit, we'll draw a central line, or a high/low based on 0/non-0
                    let y;
                    if (typeof value === 'number' && (value === 0 || value === 1)) { // Binary signal
                        y = value === 1 ? yOffset + (signalHeight * 0.2) : yOffset + (signalHeight * 0.8);
                        ctx.lineWidth = 2; // Standard line width for binary
                    } else { // Treat as multi-bit or generic high/low
                        y = signalMidY; // Draw in the middle for generic multi-bit
                        ctx.lineWidth = 3; // Thicker line for multi-bit bus
                    }

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevX = waveformAreaStartX + (signal.timestamps[i - 1] * xScale);
                        const prevValue = signal.values[i - 1];

                        let prevY;
                        if (typeof prevValue === 'number' && (prevValue === 0 || prevValue === 1)) {
                            prevY = prevValue === 1 ? yOffset + (signalHeight * 0.2) : yOffset + (signalHeight * 0.8);
                        } else {
                            prevY = signalMidY;
                        }

                        // Draw horizontal segment
                        ctx.lineTo(x, prevY);
                        // Draw vertical transition if value changes (or if it's a multi-bit and value is different)
                        if (value !== prevValue) {
                            ctx.lineTo(x, y);
                        }
                    }
                }
                ctx.stroke();
            }
        });
    }, [waveformSignals, theme, dimmedText]);

    // Redraw on data change or panel resize
    useEffect(() => {
        let resizeObserver;
        if (isRightPanelOpen) {
            // Ensure canvasRef.current exists before trying to observe its parent
            if (canvasRef.current) {
                drawWaveforms();
                resizeObserver = new ResizeObserver(() => drawWaveforms());
                resizeObserver.observe(canvasRef.current.parentElement);
            } else {
                console.warn("Canvas ref is null, cannot attach ResizeObserver.");
            }
        }
        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [isRightPanelOpen, waveformSignals, drawWaveforms]);


    return (
        <AnimatePresence>
            {isRightPanelOpen && (
                <motion.aside
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: '0%', opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className={`fixed top-0 right-0 h-full z-20 p-4 pt-16 shadow-xl ${panelBg} ${borderColor} border-l overflow-y-auto custom-scrollbar`}
                    style={{ width: RIGHT_PANEL_WIDTH, paddingTop: TOP_NAVBAR_HEIGHT }}
                >
                    {/* Close Right Panel Button */}
                    <motion.button
                        onClick={() => setIsRightPanelOpen(false)}
                        className={`absolute top-4 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} p-2 rounded-full`}
                        style={{ left: '1rem' }} // Position within panel
                        aria-label="Close right panel"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <FaArrowRight className="w-5 h-5" />
                    </motion.button>

                    <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>Waveform Viewer</h3>
                    <div
                        className={`output-log-panel p-2 custom-scrollbar ${borderColor} border flex items-center justify-center ${dimmedText}`}
                        style={{ height: `calc(100% - 40px)`, overflow: 'hidden' }} // Hide overflow as canvas handles its own drawing
                    >
                        {waveformSignals.length > 0 ? (
                            <canvas ref={canvasRef} className="w-full h-full"></canvas>
                        ) : (
                            <div className="text-center">
                                <FaWaveSquare className="text-4xl mr-2 mb-2" />
                                <span>No waveform data available. Run simulation first!</span>
                            </div>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
};

export default WaveformPanel;
