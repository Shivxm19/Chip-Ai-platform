// src/components/AiChatbot.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaPaperPlane, FaSpinner, FaRobot, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// URL for the backend AI chat endpoint
const CHAT_API_URL = 'http://localhost:8000/api/v1/platform/chat';

const AiChatbot = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newUserMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);
    setInputValue('');

    try {
      const idToken = user ? await user.getIdToken() : null;
      if (!idToken) {
        throw new Error("User not authenticated.");
      }

      const response = await axios.post(CHAT_API_URL, {
        message: inputValue,
        chat_history: newHistory,
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const aiResponse = response.data.response;
      const newAiMessage = {
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setChatHistory(prevHistory => [...prevHistory, newAiMessage]);

    } catch (err) {
      console.error("Error communicating with AI backend:", err);
      setError(err?.response?.data?.detail || "Failed to get a response from the AI assistant.");
      setChatHistory(newHistory.slice(0, -1)); // Rollback optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  const toggleChatbot = () => setIsOpen(!isOpen);

  return (
    <>
      <motion.button
        className="fixed bottom-8 right-8 z-[100] text-white p-4 rounded-full shadow-lg cursor-pointer ai-assistant-fab"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.8 }}
        onClick={toggleChatbot}
        aria-label="Open AI Assistant"
      >
        <FaComments className="fab-icon text-2xl" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed bottom-24 right-8 z-[100] w-full max-w-sm h-[80vh] flex flex-col bg-gray-900 rounded-xl shadow-2xl border border-gray-700"
          >
            <div className="flex justify-between items-center p-4 bg-gray-800 rounded-t-xl border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-purple-400 text-xl" />
                <h3 className="text-white font-bold">AI Assistant</h3>
              </div>
              <button onClick={toggleChatbot} className="text-gray-400 hover:text-white" aria-label="Close chatbot">
                <FaTimes />
              </button>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-start space-x-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <FaRobot className="text-purple-400 mt-1" />}
                  <div className={`p-3 rounded-xl max-w-[85%] text-sm ${
                    msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && <FaUser className="text-gray-400 mt-1" />}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-2 justify-start">
                  <FaRobot className="text-purple-400 mt-1 animate-pulse" />
                  <div className="p-3 rounded-xl max-w-[85%] text-sm bg-gray-700 text-gray-200 rounded-bl-none">
                    <FaSpinner className="animate-spin" />
                  </div>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-900/20 text-red-400 rounded-lg">
                  <p>{error}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a technical question..."
                  className="w-full pl-4 pr-12 py-3 rounded-full bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-purple-400 hover:text-purple-300 disabled:text-gray-500"
                  aria-label="Send message"
                  disabled={isLoading}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatbot;
