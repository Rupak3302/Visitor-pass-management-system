import api from './api';


// pre-registering a visitor (with photo upload)
// Uses multipart/form-data because we are sending a file
export const registerUser = async (formData) => {
    const response = await api.post('/visitors', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get list fo the available hosts for dropdown selection when registering a visitor
export const getHosts = async () => {
    const response = await api.get('/visitors/hosts');
    return response.data;
};