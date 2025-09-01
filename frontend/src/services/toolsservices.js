        // frontend/src/services/toolService.js
        // This file provides functions for interacting with your EDA tools
        // by calling your FastAPI backend endpoints.

        import axios from 'axios';
        import { API_BASE_URL } from '../config';
        import { auth } from '../firebaseconfig'; // Import Firebase auth to get current user's ID token

        const toolsUrl = `${API_BASE_URL}/tools`; // Base URL for tool-related backend endpoints

        // Helper function to get authenticated headers for backend requests
        const getAuthHeaders = async () => {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) {
                throw new Error("No Firebase user logged in. Authentication required.");
            }
            const idToken = await firebaseUser.getIdToken();
            return {
                Authorization: `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            };
        };

        // Function to initiate a PCB Design Tool run
        export const runPcbDesignTool = async (projectId, designParameters) => {
            try {
                const headers = await getAuthHeaders();
                const response = await axios.post(`${toolsUrl}/pcb/design`, {
                    project_id: projectId,
                    design_parameters: designParameters
                }, { headers });
                return response.data; // Returns job ID and message
            } catch (error) {
                console.error("Error running PCB tool:", error.response?.data || error.message);
                throw error;
            }
        };

        // Function to get the status of a PCB tool job
        export const getPcbToolStatus = async (jobId) => {
            try {
                const headers = await getAuthHeaders();
                const response = await axios.get(`${toolsUrl}/pcb/status/${jobId}`, { headers });
                return response.data; // Returns status, message, output availability
            } catch (error) {
                console.error("Error getting PCB tool status:", error.response?.data || error.message);
                throw error;
            }
        };

        // Function to get the download URL for PCB tool output
        export const downloadPcbToolOutput = async (jobId) => {
            try {
                const headers = await getAuthHeaders();
                const response = await axios.get(`${toolsUrl}/pcb/download/${jobId}`, { headers });
                return response.data.download_url; // Returns the direct download URL
            } catch (error) {
                console.error("Error getting PCB tool download URL:", error.response?.data || error.message);
                throw error;
            }
        };

        // You would add similar functions for Chip and Platform tools here:
        /*
        export const runChipSynthesisTool = async (projectId, synthesisParameters) => {
            const headers = await getAuthHeaders();
            const response = await axios.post(`${toolsUrl}/chip/synthesis`, {
                project_id: projectId,
                synthesis_parameters: synthesisParameters
            }, { headers });
            return response.data;
        };
        export const getChipToolStatus = async (jobId) => { ... };
        export const downloadChipToolOutput = async (jobId) => { ... };

        export const runPlatformSimulationTool = async (projectId, simulationParameters) => {
            const headers = await getAuthHeaders();
            const response = await axios.post(`${toolsUrl}/platform/simulation`, {
                project_id: projectId,
                simulation_parameters: simulationParameters
            }, { headers });
            return response.data;
        };
        export const getPlatformToolStatus = async (jobId) => { ... };
        export const downloadPlatformToolOutput = async (jobId) => { ... };
        */
        