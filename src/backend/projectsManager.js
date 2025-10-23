/**
 * Projects Manager Module
 * 
 * Handles persistent storage of projects using JSON file
 * for the ApparentlyAR data visualization platform.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Path to the projects.json file
const PROJECTS_FILE = path.join(__dirname, '../../projects.json');

/**
 * Initialize projects file with empty array if it doesn't exist
 */
function initializeProjectsFile() {
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Read projects from JSON file
 * @returns {Array} Array of project objects
 */
function readProjects() {
  try {
    initializeProjectsFile();
    const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
    const projects = JSON.parse(data);
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error('Error reading projects file:', error);
    return [];
  }
}

/**
 * Write projects to JSON file
 * @param {Array} projects - Array of project objects
 */
function writeProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error writing projects file:', error);
  }
}

/**
 * Get all projects
 * @returns {Array} Array of project objects
 */
function getAllProjects() {
  return readProjects();
}

/**
 * Get project by ID
 * @param {number} id - Project ID
 * @returns {Object|null} Project object or null if not found
 */
function getProjectById(id) {
  const projects = readProjects();
  return projects.find(project => project.id === id) || null;
}

/**
 * Create a new project
 * @param {Object} projectData - Project data (name, description)
 * @returns {Object} Created project object
 */
function createProject(projectData) {
  const projects = readProjects();
  const newProject = {
    id: Date.now(), // Simple ID generation
    name: projectData.name,
    description: projectData.description,
    status: 'Inactive',
    csvData: projectData.csvData || null, // Store CSV data if provided
    csvHeaders: projectData.csvHeaders || null, // Store CSV headers if provided
    csvFilename: projectData.csvFilename || null, // Store CSV filename if provided
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  projects.push(newProject);
  writeProjects(projects);
  
  return newProject;
}

/**
 * Update project by ID
 * @param {number} id - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Object|null} Updated project object or null if not found
 */
function updateProject(id, projectData) {
  const projects = readProjects();
  const projectIndex = projects.findIndex(project => project.id === id);
  
  if (projectIndex !== -1) {
    projects[projectIndex] = {
      ...projects[projectIndex],
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    
    writeProjects(projects);
    return projects[projectIndex];
  }
  
  return null;
}

/**
 * Delete project by ID
 * @param {number} id - Project ID
 * @returns {boolean} True if project was deleted, false if not found
 */
function deleteProject(id) {
  const projects = readProjects();
  const initialLength = projects.length;
  
  const filteredProjects = projects.filter(project => project.id !== id);
  writeProjects(filteredProjects);
  
  return filteredProjects.length < initialLength;
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};