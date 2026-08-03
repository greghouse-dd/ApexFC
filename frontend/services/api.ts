import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://apexfc-backend.onrender.com";
  }
  return "http://127.0.0.1:8000";
};

export const aiApi = axios.create({
  baseURL: getApiBaseUrl(),
});

export const getSimilarPlayers = async (fifaId: number, k: number = 5) => {
  const response = await aiApi.get(`/ai/similarity/${fifaId}?k=${k}`);
  return response.data;
};

export const getHiddenGems = async (limit: number = 10) => {
  const response = await aiApi.get(`/ai/hidden-gems?limit=${limit}`);
  return response.data;
};

export const askTacticalAdvisor = async (query: string) => {
  const response = await aiApi.post('/ai/tactical-advisor', { query });
  return response.data;
};
