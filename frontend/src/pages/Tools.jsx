    // frontend/src/pages/ToolPage.jsx
    // A generic placeholder component for individual tool pages.
    // It displays the tool ID from the URL.

    import React from 'react'; // Ensure React is imported
    import { useParams, useNavigate } from 'react-router-dom'; // Import necessary hooks

    function ToolPage() { // Define the component as a function
        // Extracts the 'toolId' from the URL (e.g., /tools/rtl-editor -> toolId = "rtl-editor")
        const { toolId } = useParams();
        const navigate = useNavigate(); // Hook to programmatically navigate

        // Function to format the toolId for display (e.g., "rtl-editor" -> "RTL Editor")
        const formatToolName = (id) => {
            if (!id) return 'Unknown Tool';
            // Replace hyphens with spaces, then capitalize each word
            return id.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                minHeight: '100vh',
                backgroundColor: '#1a1a23', // Dark background
                color: 'white', // White text
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Inter, sans-serif' // Ensure font-family is set
            }}>
                <h1 style={{ fontSize: '3em', marginBottom: '20px', color: '#a78bfa' }}>
                    {formatToolName(toolId)}
                </h1>
                <p style={{ fontSize: '1.2em', margin: '15px 0', maxWidth: '800px' }}>
                    This is the dedicated page for the **{formatToolName(toolId)}** tool.
                </p>
                <p style={{ fontSize: '1em', color: '#ccc', maxWidth: '800px' }}>
                    Here you would implement the actual interactive UI and functionality for this specific EDA tool.
                    This page can fetch more details about the tool from the backend if needed (e.g., using `toolId`).
                </p>
                <button
                    onClick={() => navigate('/tools-overview')} // Button to navigate back to the overview
                    style={{
                        marginTop: '30px',
                        padding: '12px 25px',
                        backgroundColor: '#8a2be2', // Purple button
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                        transition: 'background-color 0.3s ease, transform 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#a740ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8a2be2'}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Go Back to Tools Overview
                </button>
            </div>
        );
    }

    export default ToolPage; // This MUST be a default export
    