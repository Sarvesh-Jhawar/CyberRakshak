// lib/api.ts

const API_BASE_URL = "http://127.0.0.1:8000"; // Assuming this is the root

// ML Model API — runs separately on port 8001 (start with: uvicorn api.main:app --port 8001)
export const ML_API_BASE_URL = "http://127.0.0.1:8001";

export const api = {
    auth: {
        login: `${API_BASE_URL}/api/v1/auth/login`,
        register: `${API_BASE_URL}/api/v1/auth/register`,
        me: `${API_BASE_URL}/api/v1/auth/me`,
        logout: `${API_BASE_URL}/api/v1/auth/logout`,
    },
    incidents: {
        list: `${API_BASE_URL}/api/v1/incidents`,
        create: `${API_BASE_URL}/api/v1/incidents/`,
        detail: (id: string | number) => `${API_BASE_URL}/api/v1/incidents/${id}`,
        comments: (id: string | number) => `${API_BASE_URL}/api/v1/incidents/${id}/comments`,
    },
    chat: {
        sudarshan: `${API_BASE_URL}/api/llm/sudarshan-chakra`,
    },
    // ML model endpoints (called by the backend agent, not the frontend directly)
    ml_models: {
        phishing: `${ML_API_BASE_URL}/predict/phishing`,
        malware: `${ML_API_BASE_URL}/predict/malware`,
        ransomware: `${ML_API_BASE_URL}/predict/ransomware`,
        networking: `${ML_API_BASE_URL}/predict/networking`,
        zeroDay: `${ML_API_BASE_URL}/predict/zero-day`,
        health: `${ML_API_BASE_URL}/`,
    },
    admin: {
        dashboardStats: `${API_BASE_URL}/api/v1/admin/dashboard/stats`,
        dashboardAlerts: `${API_BASE_URL}/api/v1/admin/dashboard/alerts`,
        incidentsTrends: `${API_BASE_URL}/api/v1/admin/incidents/trends`,
        incidentsRisk: `${API_BASE_URL}/api/v1/admin/incidents/risk`,
        incidentsPriority: `${API_BASE_URL}/api/v1/admin/incidents/priority`,
        incidentsHeatmap: `${API_BASE_URL}/api/v1/admin/incidents/heatmap`,
        profile: `${API_BASE_URL}/api/v1/admin/profile`,
        changePassword: `${API_BASE_URL}/api/v1/admin/profile/change-password`,
        actions: `${API_BASE_URL}/api/v1/admin/actions`,
        summary: `${API_BASE_URL}/api/v1/admin/summary`,
        users: `${API_BASE_URL}/api/v1/admin/users`,
        updateUserStatus: (id: string | number) => `${API_BASE_URL}/api/v1/admin/users/${id}/status`,
        bulkNotification: `${API_BASE_URL}/api/v1/admin/notifications/bulk`,
        createBackup: `${API_BASE_URL}/api/v1/admin/system/backup`,
        exportIncidents: `${API_BASE_URL}/api/v1/admin/export/incidents`,
    },
    notifications: {
        list: `${API_BASE_URL}/api/notifications`,
        markRead: (id: string | number) => `${API_BASE_URL}/api/notifications/${id}/read`,
        delete: (id: string | number) => `${API_BASE_URL}/api/notifications/${id}`,
        markAllRead: `${API_BASE_URL}/api/notifications/read-all`,
        count: `${API_BASE_URL}/api/notifications/count`,
    },
    gmail: {
        authorize: `${API_BASE_URL}/api/v1/auth/gmail/authorize`,
        callback: `${API_BASE_URL}/api/v1/auth/gmail/callback`,
        disconnect: `${API_BASE_URL}/api/v1/auth/gmail/disconnect`,
        status: `${API_BASE_URL}/api/v1/auth/gmail/status`,
    },
    emails: {
        list: `${API_BASE_URL}/api/v1/emails`,
        detail: (id: string) => `${API_BASE_URL}/api/v1/emails/${id}`,
        stats: `${API_BASE_URL}/api/v1/emails/stats/overview`,
        markRead: (id: string) => `${API_BASE_URL}/api/v1/emails/${id}/mark-read`,
        delete: (id: string) => `${API_BASE_URL}/api/v1/emails/${id}`,
    }
};

export const getAuthHeaders = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
    }
    return {};
};

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Analyzes the given text and optional file using the backend LLM service.
 * Supports images (sent to vision model), PDFs, and DOCX files.
 *
 * @param textInput The text to be analyzed.
 * @param history The conversation history.
 * @param attachedFile An optional file (image, PDF, DOCX) to be included in the analysis.
 * @returns A promise that resolves to the JSON analysis from the backend.
 * @throws An error if the request fails.
 */
export async function analyzeWithLlm(textInput: string, history: ChatMessage[], attachedFile?: File): Promise<any> {
  const formData = new FormData();
  formData.append('text_input', textInput);
  formData.append('history', JSON.stringify(history));

  if (attachedFile) {
    formData.append('file', attachedFile);
  }

  try {
    const authHeaders = getAuthHeaders();
    const response = await fetch('http://127.0.0.1:8000/api/llm/analyze', {
      method: 'POST',
      body: formData,
      headers: {
          ...authHeaders
      }
    });

    if (!response.ok) {
      // Special handling for 401 to give a better message
      if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json();
      const detail = errorData.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ') : 'An unknown error occurred.');
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling analysis API:', error);
    throw error;
  }
}