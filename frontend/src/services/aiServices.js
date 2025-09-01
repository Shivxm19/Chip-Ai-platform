// src/services/aiService.js
/**
 * This file encapsulates all AI-related logic, primarily interacting with the Gemini API.
 * It's designed to be easily swappable with a custom-trained AI model later on.
 */

// IMPORTANT: The API key for Gemini models (gemini-2.0-flash, imagen-3.0-generate-002)
// is automatically provided by the Canvas environment if left as an empty string.
// Do NOT hardcode your API key here for these specific models.
const GEMINI_API_KEY = ""; // Canvas will inject this if left empty for allowed models
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Generates text content using the Gemini 2.0 Flash model.
 * @param {string} prompt The text prompt to send to the AI model.
 * @returns {Promise<string>} A promise that resolves with the generated text.
 * @throws {Error} If the API call fails or the response is malformed.
 */
export async function generateText(prompt) {
    if (!prompt) {
        throw new Error("Prompt cannot be empty.");
    }

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Gemini API response structure unexpected:", result);
            throw new Error("Failed to generate text: Unexpected API response structure.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`Failed to generate text: ${error.message}`);
    }
}

// You can add more specific AI functions here as needed for different tools:

/**
 * Generates an explanation for a given piece of RTL code.
 * @param {string} rtlCode The RTL code to explain.
 * @returns {Promise<string>} A promise that resolves with the explanation.
 */
export async function generateCodeExplanation(rtlCode) {
    const prompt = `Explain the following RTL (Register Transfer Level) code in simple terms, highlighting its functionality and purpose:\n\n\`\`\`verilog\n${rtlCode}\n\`\`\``;
    return generateText(prompt);
}

/**
 * Suggests optimizations for a given piece of RTL code.
 * @param {string} rtlCode The RTL code to optimize.
 * @returns {Promise<string>} A promise that resolves with optimization suggestions.
 */
export async function suggestRTLOptimizations(rtlCode) {
    const prompt = `Analyze the following RTL code for potential optimizations (e.g., for area, power, or performance). Provide specific suggestions and explain why they are beneficial:\n\n\`\`\`verilog\n${rtlCode}\n\`\`\``;
    return generateText(prompt);
}

/**
 * Generates a basic testbench for a given RTL module.
 * @param {string} rtlCode The RTL module code for which to generate a testbench.
 * @param {string} moduleName The name of the module to be tested.
 * @returns {Promise<string>} A promise that resolves with the generated testbench code.
 */
export async function generateTestbench(rtlCode, moduleName) {
    const prompt = `Generate a basic Verilog testbench for the following RTL module. The testbench should instantiate the module, provide some simple input stimuli, and monitor outputs. Focus on demonstrating basic functionality.\n\nModule:\n\`\`\`verilog\n${rtlCode}\n\`\`\`\n\nTestbench for module: ${moduleName}`;
    return generateText(prompt);
}

// Add more functions for other AI use cases as we define them for different tools.
