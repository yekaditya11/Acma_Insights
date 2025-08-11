/**
 * API Service for AI Safety Summarizer
 * Handles all communication with the backend API
 */

import axios from 'axios';
// requestOptimizer removed

const API_BASE_URL ='http://13.50.248.45:8001';

//const API_BASE_URL ='http://localhost:8005';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increased to 2 minutes for large context model processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', error);

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.error || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

// API Service Class (trimmed to Supplier, Insights, Chat, File Upload)
class ApiService {
  // Health check removed

  // Conversational AI Chat Methods
  async startConversation(userId = 'anonymous') {
    // No longer needed for the new conversational BI system
    // Return a mock session for compatibility
    return {
      success: true,
      session_id: `convbi_${Date.now()}`,
      message: "Hello! I'm your AI Assistant. How can I assist you?"
    };
  }

  async sendChatMessage(message, sessionId = null, userId = 'anonymous') {
    try {
      console.log('💬 API: Sending message to /chat:', message);
      console.log('💬 API: Request URL:', `${API_BASE_URL}/chat`);
      console.log('💬 API: Request payload:', { question: message });

      // Axios instance returns response.data directly (see interceptor)
      const response = await api.post('/chat', { question: message });
      console.log('💬 API: /chat response received:', response);

      // Backend returns: { question, sql_query, query_result, final_answer, visualization_data? }
      // Normalize to chatbot response shape
      let dataContext = null;
      try {
        if (typeof response?.query_result === 'string') {
          dataContext = JSON.parse(response.query_result);
        } else if (response?.query_result) {
          dataContext = response.query_result;
        }
      } catch (e) {
        console.warn('💬 API: Failed to parse query_result JSON:', e);
        dataContext = null;
      }

      // Extract visualization data if present
      let chartData = null;
      if (response?.visualization_data) {
        try {
          const rawChartData = typeof response.visualization_data === 'string'
            ? JSON.parse(response.visualization_data)
            : response.visualization_data;
          chartData = this.sanitizeChartData(rawChartData);
        } catch (e) {
          console.warn('💬 API: Failed to parse visualization_data:', e);
          chartData = null;
        }
      }

      const finalResponse = {
        success: true,
        message: this.extractTextFromResponse(response?.final_answer) || 'No response available',
        data_context: dataContext,
        chart_data: chartData,
        sql_query: response?.sql_query || null,
        suggested_actions: [
          'How many days of work were lost due to an unsafe event?',
          'Create a graph showing a trend of incidents reported in SR1, SR2, NR1 and NR2 for the last three months.',
          'Which hazards are commonly occurring in all regions?',
          'Are there any recurring patterns observed for the unsafe events reported this year?',
          'Which region has reported the most number of unsafe events?'
        ]
      };

      console.log('💬 API: Normalized chat response:', finalResponse);
      return finalResponse;
    } catch (error) {
      console.error('💬 API: /chat error:', error);
      console.error('💬 API: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        message: this.extractTextFromResponse(error.message) || 'Sorry, I encountered an error processing your request. Please try again.',
        error: this.extractTextFromResponse(error.message) || error.toString()
      };
    }
  }

  // Streaming chat via Server-Sent Events (SSE)
  // Returns an object with: { cancel: () => void }
  // onEvent receives parsed events: { type: 'node_update'|'final', data, timestamp }
  startChatStream(message, onEvent, onError) {
    const url = `${API_BASE_URL}/chat/stream`;
    const controller = new AbortController();
    const signal = controller.signal;

    const run = async () => {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: message, stream: true }),
          signal,
        });
        if (!resp.ok || !resp.body) {
          throw new Error(`Stream failed with status ${resp.status}`);
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sepIndex;
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const sseChunk = buffer.slice(0, sepIndex).trim();
            buffer = buffer.slice(sepIndex + 2);
            if (!sseChunk) continue;
            // Expect lines like: data: {json}
            const dataLine = sseChunk.split('\n').find(l => l.startsWith('data: '));
            if (dataLine) {
              const jsonStr = dataLine.slice(6);
              try {
                const evt = JSON.parse(jsonStr);
                onEvent && onEvent(evt);
              } catch (e) {
                console.warn('SSE parse error:', e, jsonStr);
              }
            }
          }
        }
      } catch (err) {
        if (onError) onError(err);
      }
    };

    run();

    return { cancel: () => controller.abort() };
  }

  async clearConversation(sessionId) {
    // No conversation state to clear in the new system
    return {
      success: true,
      message: "Conversation cleared"
    };
  }

  // Removed unused chat helpers and insights feedback endpoints

  // Remove legacy AI analysis and KPI endpoints (not used by current app)

  // Dashboard Management Methods
  // Removed unused dashboard save/load/list endpoints

  // Chart Management Methods
  async addChartToDashboard(chartData, title, source = 'chat', userId = 'anonymous') {
    const response = await api.post('/dashboard/add-chart', {
      chart_data: chartData,
      title: title,
      source: source,
      user_id: userId
    });
    
    // Ensure response has success property for compatibility
    return {
      success: response.status === 'success',
      ...response
    };
  }

  async getUserCharts(userId = 'anonymous') {
    const response = await api.get(`/dashboard/charts/${userId}`);
    
    // Ensure response has success property for compatibility
    return {
      success: response.status === 'success',
      charts: response.charts || [],
      ...response
    };
  }

  async deleteChart(chartId) {
    return api.delete(`/dashboard/charts/${chartId}`);
  }

  // Removed unused dashboard delete and debug endpoints

  // Internal request optimizer still attached to window for debugging; no public exports

  // Supplier Performance Dashboard (Excel-driven analytics)
  async getSupplierDashboardAnalytics() {
    // FastAPI server exposes GET /dashboard which returns { message, data, totalSuppliers, totalKPIs }
    return api.get('/dashboard');
  }

  // Supplier Insights - General
  async getSupplierGeneralInsights(refresh = false) {
    return api.get('/insights', { params: { refresh } });
  }

  // Supplier Insights - Generate more (additional)
  async generateSupplierAdditionalInsights() {
    return api.post('/generate_more_insights');
  }

  // Remove other dashboard endpoints and insights cache usage

  // Helper to extract text from a response object or string
  extractTextFromResponse(response) {
    if (typeof response === 'string') {
      return response;
    } else if (typeof response === 'object' && response !== null) {
      // Handle various object formats that might contain text
      if ('text' in response) {
        return response.text;
      } else if ('content' in response) {
        return response.content;
      } else if ('message' in response) {
        return response.message;
      }
      // If it's an object without recognizable text property, convert to string
      return JSON.stringify(response);
    }
    return null;
  }

  // Helper to ensure chart data doesn't contain renderable objects
  sanitizeChartData(chartData) {
    if (!chartData || typeof chartData !== 'object') {
      return chartData;
    }

    const sanitized = { ...chartData };
    
    // Ensure title is properly formatted
    if (sanitized.title && typeof sanitized.title === 'object' && sanitized.title.text) {
      // Keep the object structure for ECharts but ensure it's not rendered directly
      sanitized.displayTitle = sanitized.title.text;
    } else if (typeof sanitized.title === 'string') {
      sanitized.displayTitle = sanitized.title;
    }

    console.log('Sanitized chart data:', sanitized);
    return sanitized;
  }

  // Insights Cache Management Methods
  clearInsightsCache() {}
  getInsightsCacheStats() { return {}; }

  // File Upload Methods
  async uploadAndAnalyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload_excel/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let message = 'File upload failed';
        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch (_) {
          // ignore parse error
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

// Add requestOptimizer to window for debugging
// Remove requestOptimizer global attachment

// Export singleton instance
export default apiService;

// Export individual methods for convenience (only those used in the app)
export const {
  // Chat (only used ones)
  startConversation,
  sendChatMessage,
  clearConversation,
  // Dashboard chart management
  addChartToDashboard,
  getUserCharts,
  deleteChart,
  // Supplier analytics and insights
  getSupplierDashboardAnalytics,
  getSupplierGeneralInsights,
  generateSupplierAdditionalInsights,
  // Insights cache (no-op)
  clearInsightsCache,
  getInsightsCacheStats,
  // File upload
  uploadAndAnalyzeFile,
} = apiService;

// Removed legacy fetch* KPI helpers
