import axios from 'axios'; // for react frontend talk to node.js backend

// I set it a the default base URL here 
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    // baseURL: 'http://192.168.29.209:5000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// This interceptes every request and adds the Bearer token if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); // get the token from browser
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;

    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;

