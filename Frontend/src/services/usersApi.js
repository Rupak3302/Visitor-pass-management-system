import api from './api';

// login function
export const loginUser = async (Credentials) => {
    const response = await api.post('/user/login', Credentials);
    return response.data;
};

// ** Admin User Management ** 

// Fetch all the users (with search androle filter) 
export const getAllUsers = async (roleFilter = 'All', search = '') => {
    let url = `/user/admin/all?role=${roleFilter}`;
    
    if (search && search.trim() !== '') {
        url += `&search=${search}`;
    }
    
    const response = await api.get(url);
    return response.data;
};

// Admin create now users (host, security, admin)
export const registerUser = async (userData) => {
    const response = await api.post('/user/register', userData);
    return response.data;   
};

// Toggle user active/deactive status
export const toggleUserStatus = async (id) => {
    const response = await api.patch(`/user/admin/status/${id}`);
    return response.data;
};

// Permanently delete a user from the system
export const deleteUser = async (id) => {
    const response = await api.delete(`/user/admin/delete/${id}`);
    return response.data;
};