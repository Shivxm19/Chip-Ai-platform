// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Protectedroute from './components/Protectedroute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/Auth/AuthPage.jsx';
import Dashboard from './pages/Dashboard';
import ToolsOverviewPage from './ToolsOverview.jsx';
import ProjectManagement from './pages/ProjectManagement.jsx';
// CHIP TOOLS
import RtlCodeEditor from './pages/Tools/Chip/RTLCode.jsx';
import SchematicEditor from './pages/Tools/Chip/Schematiceditor.jsx';
import RTLSimulator from './pages/Tools/Chip/RTLSimulator.jsx';
// PCB TOOLS
import PCBSchematicEditor from './pages/Tools/PCB/PCBSchematicEditor.jsx';

import AdminPage from './pages/Adminpage'; // Import AdminPage
import { AuthProvider } from './context/AuthContext';
import AiChatbot from './components/AIchatbot.jsx';

// --- Placeholder Components for all routes to prevent "Module not found" errors ---

const YourMembershipPage = () => <div className="min-h-screen flex items-center justify-center"><h2>Your Membership Page Placeholder</h2></div>;
const ContactPage = () => <div className="min-h-screen flex items-center justify-center"><h2>Contact Page Placeholder</h2></div>;
const PricingPage = () => <div className="min-h-screen flex items-center justify-center"><h2>Pricing Page Placeholder</h2></div>;
const UnauthorizedPage = () => <div className="min-h-screen flex items-center justify-center"><h2>Unauthorized Page</h2></div>;


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - Accessible to all */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/Authpage" element={<AuthPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected Routes - All routes requiring authentication */}
          <Route element={<Protectedroute allowedRoles={['user', 'admin']} />}>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/tools-overview" element={<ToolsOverviewPage />} />
            <Route path="/project-management" element={<ProjectManagement />} />
            /* CHIP Tools */
            <Route path="/tools/rtl-code-editor" element={<RtlCodeEditor />} />
            <Route path="/tools/schematic-editor-chip" element={<SchematicEditor />} />
             <Route path="/tools/rtl-simulator" element={<RTLSimulator />} />
            // PC Tools
            <Route path="/tools/pcb-schematic-editor" element={<PCBSchematicEditor />} />
         
            <Route path="/your-membership" element={<YourMembershipPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing-page" element={<PricingPage />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Admin Protected Route - Only for 'admin' role */}
          <Route element={<Protectedroute allowedRoles={['admin']} />}>
            <Route path="/admin-panel" element={<AdminPage />} />
          </Route>
          
          {/* Catch-all for undefined routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AiChatbot />
      </AuthProvider>
    </Router>
  );
}

export default App;
