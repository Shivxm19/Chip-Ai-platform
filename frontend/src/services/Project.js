// src/services/projectService.js
import { db, auth } from '../firebaseconfig';
import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where 
} from 'firebase/firestore';

// Get all projects for the current user
export const getMyProjects = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("No authenticated user found.");
      return [];
    }

    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching projects:", error.message);
    return [];
  }
};

// Create a new project
export const createProject = async (projectData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const projectWithUser = {
      ...projectData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'projects'), projectWithUser);
    
    return { 
      id: docRef.id, 
      ...projectWithUser 
    };
  } catch (error) {
    console.error("Error creating project:", error.message);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    console.log(`Project ${projectId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting project:", error.message);
    throw error;
  }
};

// Get a single project by ID
export const getProjectById = async (projectId) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { 
        id: docSnap.id, 
        ...docSnap.data() 
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting project:", error.message);
    throw error;
  }
};

// Update a project
export const updateProject = async (projectId, updates) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating project:", error.message);
    throw error;
  }
};