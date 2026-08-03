import axios from "axios";
import { getToken, removeToken } from "./token";

const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
        return envUrl.trim().replace(/\/+$/, "");
    }
    return "http://127.0.0.1:8000";
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            removeToken();
        }
        return Promise.reject(error);
    }
);

export default api;