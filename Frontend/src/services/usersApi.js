import api from './api';

export const loginUser = async (Credentials) => {
    const response = await api.post('/user/login', Credentials);
    return response.data;
};