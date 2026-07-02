import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("inventra_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.data?.code;
    const billingSafePages = ["/billing", "/billing/return", "/pricing", "/login", "/register"];

    if (status === 402 && code === "SUBSCRIPTION_REQUIRED" && !billingSafePages.includes(window.location.pathname)) {
      window.location.assign("/billing");
    }

    return Promise.reject(error);
  }
);

export default api;
