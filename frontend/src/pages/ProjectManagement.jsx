// src/pages/ProjectManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaTrash, FaEdit, FaCode, FaMicrochip,
  FaArrowRight, FaSearch, FaFolder, FaCalendar, FaFilter,
  FaSort, FaDownload, FaUpload, FaUsers, FaTag, FaTimes,
  FaUserPlus, FaCheck, FaSpinner, FaSignInAlt, FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getMyProjects, createProject, deleteProject, updateProject } from '../services/Project';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProject, setSelectedProject] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState('');

  const [newProject, setNewProject] = useState({
    name: '',
    type: 'rtl',
    description: '',
    tags: []
  });

  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, filterType, sortBy]);

  const loadProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const projectsData = await getMyProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || project.type === filterType;
      return matchesSearch && matchesFilter;
    });

    // Sort projects
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate());
        case 'oldest':
          return new Date(a.createdAt?.toDate()) - new Date(b.createdAt?.toDate());
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!newProject.name.trim()) {
      setCreateError('Project name is required');
      return;
    }

    setCreatingProject(true);
    setCreateError('');

    try {
      const projectData = {
        name: newProject.name.trim(),
        type: newProject.type,
        description: newProject.description,
        tags: newProject.tags,
        files: [
          {
            name: 'main.sv',
            content: `// ${newProject.name}\n// Created on ${new Date().toLocaleDateString()}\n\nmodule main();\n  // Your code here\nendmodule`
          }
        ]
      };

      const createdProject = await createProject(projectData);
      setShowCreateModal(false);
      setNewProject({ name: '', type: 'rtl', description: '', tags: [] });
      
      // Reload projects to show the newly created one
      await loadProjects();
      
      // Show success message
      alert(`Project "${createdProject.name}" created successfully!`);
      
    } catch (error) {
      console.error("Error creating project:", error);
      setCreateError(error.message || 'Failed to create project. Please try again.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (window.confirm(`Delete project "${projectName}"? This action cannot be undone.`)) {
      try {
        await deleteProject(projectId);
        loadProjects();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '' });
      loadProjects();
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials.");
    }
  };

  const handleInviteCollaborator = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!inviteEmail) return;
    
    setInviteLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setInviteSuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error inviting collaborator:", error);
    } finally {
      setInviteLoading(false);
    }
  };

  const getProjectIcon = (type) => {
    switch (type) {
      case 'rtl': return FaCode;
      case 'schematic': return FaMicrochip;
      case 'pcb': return FaMicrochip;
      default: return FaFolder;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-gray-400">Manage your design projects and collaborate with your team</p>
        </div>
        <div className="flex gap-4">
          {user ? (
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <FaUserCircle className="text-purple-400" />
              <span>{user.email}</span>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center font-semibold"
            >
              <FaSignInAlt className="mr-2" /> Login
            </button>
          )}
          <button
            onClick={() => {
              if (!user) {
                setShowLoginModal(true);
                return;
              }
              setShowCreateModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg flex items-center font-semibold"
          >
            <FaPlus className="mr-2" /> New Project
          </button>
        </div>
      </div>

      {user ? (
        <>
          {/* Filters and Search */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm mb-2">Search Projects</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Filter by Type */}
              <div>
                <label className="block text-sm mb-2">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="rtl">RTL Design</option>
                  <option value="schematic">Schematic</option>
                  <option value="pcb">PCB Layout</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredProjects.map((project) => {
              const ProjectIcon = getProjectIcon(project.type);
              return (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <ProjectIcon className="text-2xl text-purple-400 mr-3" />
                      <div>
                        <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-gray-400 text-sm capitalize">{project.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {project.createdAt?.toDate ? new Date(project.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-gray-300 mb-4 text-sm line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/tools/${project.type}?project=${project.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm flex items-center"
                      >
                        <FaArrowRight className="mr-1" /> Open
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setShowInviteModal(true);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm flex items-center"
                      >
                        <FaUsers className="mr-1" /> Share
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Project"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <FaFolder className="text-6xl mx-auto mb-4" />
              <p>No projects found. Create your first project to get started!</p>
            </div>
          )}
        </>
      ) : (
        /* Login Prompt */
        <div className="text-center py-20">
          <div className="max-w-md mx-auto bg-gray-800 rounded-xl p-8">
            <FaUserCircle className="text-6xl text-purple-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Please Login to Access Projects</h2>
            <p className="text-gray-400 mb-6">
              You need to be logged in to view, create, and manage your projects.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold flex items-center justify-center mx-auto"
            >
              <FaSignInAlt className="mr-2" /> Login Now
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Create New Project</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                  }}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="My Awesome Project"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm mb-2">Project Type</label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject({...newProject, type: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="rtl">RTL Design</option>
                    <option value="schematic">Schematic</option>
                    <option value="pcb">PCB Layout</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm mb-2">Description (Optional)</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                    rows="3"
                    placeholder="Describe your project..."
                  />
                </div>

                {createError && (
                  <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-md">
                    {createError}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError('');
                    }}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                    disabled={creatingProject}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white flex items-center justify-center"
                    disabled={creatingProject}
                  >
                    {creatingProject ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Login Required</h3>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm mb-2">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Your password"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-white"
                  >
                    Login
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Collaborator Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Invite Collaborator</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteSuccess(false);
                  }}
                  className="p-1 rounded-full hover:bg-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              
              <p className="mb-4 text-gray-400">
                Invite someone to collaborate on "{selectedProject?.name}"
              </p>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-white">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
                    disabled={inviteLoading || inviteSuccess}
                  />
                  {inviteSuccess && (
                    <FaCheck className="absolute right-3 top-3 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteSuccess(false);
                  }}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  disabled={inviteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteCollaborator}
                  className={`flex items-center px-4 py-2 rounded-md text-white ${
                    inviteSuccess 
                      ? 'bg-green-500' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={inviteLoading || !inviteEmail || inviteSuccess}
                >
                  {inviteLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Sending...
                    </>
                  ) : inviteSuccess ? (
                    'Invite Sent!'
                  ) : (
                    <>
                      <FaUserPlus className="mr-2" /> Send Invite
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManagement;