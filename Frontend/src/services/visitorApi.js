import api from './api';


// pre-registering a visitor (with photo upload)
// Uses multipart/form-data because we are sending a file
export const registerVisitor = async (formData) => {
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

// ** Admin User Management ** 

// GET: Admin fetch all the visitors in the system with optional filters
export const getAllVisitorsAdmin = async (search = '', host = '', startDate = '', endDate = '') => {
    let url = `/visitors/admin/all?`;

    // Build query parameters based on provided filters
    const params = new URLSearchParams();

    if (search && search.trim() !== '') {
        params.append('search', search);
    }
    if (host !== 'All') {
        params.append('host', host);
    }
    if (startDate) {
        params.append('startDate', startDate);
    }
    if (endDate) {
        params.append('endDate', endDate);
    }

    const response = await api.get(`${url}${params.toString()}`);
    return response.data;
}