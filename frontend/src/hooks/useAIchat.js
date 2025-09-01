// src/hooks/useAiChat.js

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CHAT_API_URL = 'http://localhost:8000/api/v1/platform/chat';

export const useAiChat = () => {
  const { user, userProfile } = useAuth();
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiUsesLeft, setAiUsesLeft] = useState(userProfile?.aiUsesLeft || 0);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newUserMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);

    try {
      const idToken = user ? await user.getIdToken() : null;
      if (!idToken) {
        throw new Error("User not authenticated.");
      }

      const response = await axios.post(CHAT_API_URL, {
        message: message,
        chat_history: newHistory,
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const aiResponse = response.data.response;
      const newAiUsesLeft = response.data.ai_uses_left;
      
      const newAiMessage = {
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prevHistory => [...prevHistory, newAiMessage]);
      setAiUsesLeft(newAiUsesLeft);
    } catch (err) {
      console.error("Error communicating with AI backend:", err);
      setError(err?.response?.data?.detail || err.message || "Failed to get a response from the AI assistant.");
    } finally {
      setIsLoading(false);
    }
  }, [chatHistory, isLoading, user]);

  return {
    chatHistory,
    isLoading,
    error,
    aiUsesLeft,
    sendMessage,
  };
};