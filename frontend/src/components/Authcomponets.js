// Example: frontend/src/components/AuthComponent.js (React example)
import React, { useState } from 'react';
import { registerUser, loginUser, getMyProfile } from '../services/authService';

function AuthComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    const handleRegister = async () => {
        try {
            const profile = await registerUser(email, password, name);
            setMessage('Registration successful!');
            setUserProfile(profile);
        } catch (error) {
            setMessage(`Registration failed: ${error.message}`);
        }
    };

    const handleLogin = async () => {
        try {
            const profile = await loginUser(email, password);
            setMessage('Login successful!');
            setUserProfile(profile);
        } catch (error) {
            setMessage(`Login failed: ${error.message}`);
        }
    };

    const handleGetProfile = async () => {
        try {
            const profile = await getMyProfile();
            setMessage('Profile fetched successfully!');
            setUserProfile(profile);
        } catch (error) {
            setMessage(`Failed to fetch profile: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Auth</h2>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleRegister}>Register</button>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleGetProfile}>Get My Profile</button>
            <p>{message}</p>
            {userProfile && (
                <pre>{JSON.stringify(userProfile, null, 2)}</pre>
            )}
        </div>
    );
}

export default AuthComponent;
