import axios from "axios";

export const api = axios.create({
  baseURL: "https://localhost:7280",
});

// adiciona Bearer automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
