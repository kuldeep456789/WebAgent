import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ActionLog {
    timestamp: string;
    action_type: string;
    description: string;
    screenshot?: string;
}

export interface AgentReport {
    status: 'running' | 'completed' | 'failed' | 'idle';
    task_id?: string;
    url?: string;
    current_page?: string;
    logs?: ActionLog[];
    issues_found?: string[];
}

export const apiService = {
    startTask: async (url: string, focus: string = "") => {
        const response = await axios.post(`${API_BASE_URL}/start-task`, { url, focus });
        return response.data;
    },

    getReport: async (): Promise<AgentReport> => {
        const response = await axios.get(`${API_BASE_URL}/report`);
        return response.data;
    },

    healthCheck: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/`);
            return response.data.status === "SentinAI is online";
        } catch (e) {
            return false;
        }
    }
};
