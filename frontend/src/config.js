// frontend/src/config.js

// Define and export the API_BASE_URL
const API_BASE_URL = 'http://localhost:8000/api/v1'; // Your Dockerized backend URL

// You should NOT import API_BASE_URL from './config' within this file.
// Other files that need API_BASE_URL will import it from here.

// If you had other code here that used API_BASE_URL (like the axios.post example),
// it should directly use the declared variable, not import it.
// Example:
// import axios from 'axios';
// axios.post(`${API_BASE_URL}/login`, { username, password }); // Correct usage

export { API_BASE_URL };
