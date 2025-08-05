// FastAPI backend client utility
const FASTAPI_BASE_URL = 'http://localhost:8000';

class FastAPIClient {
  constructor(baseURL = FASTAPI_BASE_URL) {
    this.baseURL = baseURL;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`FastAPI request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // AI Chat endpoint
  async aiChat(prompt) {
    return this.makeRequest('/api/ai-chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // Enhance prompt endpoint
  async enhancePrompt(prompt) {
    return this.makeRequest('/api/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // Generate AI code endpoint
  async generateAICode(prompt) {
    return this.makeRequest('/api/gen-ai-code', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Project management endpoints
  async getProjects() {
    return this.makeRequest('/api/projects');
  }

  async getProject(projectId) {
    return this.makeRequest(`/api/projects/${projectId}`);
  }

  async createProject(projectData) {
    return this.makeRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(projectId, updateData) {
    return this.makeRequest(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteProject(projectId) {
    return this.makeRequest(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const fastAPIClient = new FastAPIClient();

// Export individual functions for easier use
export const aiChat = (prompt) => fastAPIClient.aiChat(prompt);
export const enhancePrompt = (prompt) => fastAPIClient.enhancePrompt(prompt);
export const generateAICode = (prompt) => fastAPIClient.generateAICode(prompt);
export const healthCheck = () => fastAPIClient.healthCheck();

// Project management functions
export const getProjects = () => fastAPIClient.getProjects();
export const getProject = (projectId) => fastAPIClient.getProject(projectId);
export const createProject = (projectData) => fastAPIClient.createProject(projectData);
export const updateProject = (projectId, updateData) => fastAPIClient.updateProject(projectId, updateData);
export const deleteProject = (projectId) => fastAPIClient.deleteProject(projectId);

export default fastAPIClient;