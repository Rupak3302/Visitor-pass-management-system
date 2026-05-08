import axios from 'axios'; // for react frontend talk to node.js backend

// I set it a the default base URL here 
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// This interceptes every request and adds the Bearer token if it exists
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;

    }
    return config;
});

export default api;

