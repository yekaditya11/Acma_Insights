import axios from "axios";

// const API_URL = "http://13.51.171.153:5000";
//const API_URL = "http://localhost:9000";
 const API_URL = "http://13.51.171.153:8005";

const api = {
  // Upload and process Excel file directly
  uploadAndProcessFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/upload_excel/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error("File upload and processing failed:", error);
      throw error;
    }
  },

  // Generate additional insights from the data
  generateMoreInsights: async () => {
    try {
      const response = await axios.post(`${API_URL}/generate_more_insights`);
      return response.data;
    } catch (error) {
      console.error("Generating additional insights failed:", error);
      throw error;
    }
  },

  // Get individual sheet insights for deep dive
  getSheetInsights: async () => {
    try {
      const response = await axios.get(`${API_URL}/sheet_insights`);
      return response.data;
    } catch (error) {
      console.error("Getting sheet insights failed:", error);
      throw error;
    }
  },

  // Save user feedback (simplified implementation)
  saveFeedback: async (_, feedback) => {
    try {
      console.log("Saving feedback:", feedback);
      return { success: true };
    } catch (error) {
      console.error("Saving feedback failed:", error);
      throw error;
    }
  },

  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard`);
      return response.data;
    } catch (error) {
      console.error("Getting dashboard data failed:", error);
      throw error;
    }
  },

};

export default api;
