import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:4000/api/users"
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config;
})

// API methods
export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const getUserProfile = (userType) => API.get(`/profile?userType=${userType}`)