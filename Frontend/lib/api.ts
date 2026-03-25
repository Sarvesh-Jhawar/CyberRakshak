// lib/api.ts

const API_BASE_URL = "http://127.0.0.1:8000"; // Assuming this is the root

export const api = {
    incidents: {
        list: `${API_BASE_URL}/api/v1/incidents/`, // Corrected path
    },
    chat: {
        sudarshan: `${API_BASE_URL}/api/llm/sudarshan-chakra`,
    }
};

export const getAuthHeaders = () => {
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
 * Analyzes the given text and optional image using the backend LLM service.
 *
 * @param textInput The text to be analyzed.
 * @param history The conversation history.
 * @param imageFile An optional image file to be included in the analysis.
 * @returns A promise that resolves to the JSON analysis from the backend.
 * @throws An error if the request fails.
 */
export async function analyzeWithLlm(textInput: string, history: ChatMessage[], imageFile?: File): Promise<any> {
  const formData = new FormData();
  formData.append('text_input', textInput);
  formData.append('history', JSON.stringify(history));

  if (imageFile) {
    formData.append('image', imageFile);
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
      throw new Error(errorData.detail || 'An unknown error occurred.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling analysis API:', error);
    throw error;
  }
}