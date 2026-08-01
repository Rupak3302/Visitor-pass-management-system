import api from './api';


export const getAppointments = async (search = "", status = "All", startDate = "", endDate = "") => {

    // base search url
    let url = `/appointments?search=${search}`;

    //the status filter if it is not "All"
    if (status !== "All") {
        url += `&status=${status}`;
    }

    if (startDate) {
        url += `&startDate=${startDate}`;
    }
    if (endDate) {
        url += `&endDate=${endDate}`;
    }

    // the urs looks like /appointments?search=John&status=Approved
    const response = await api.get(url);
    return response.data;
};


export const updateAppointmentStatus = async (id, statusData) => {
    const response = await api.put(`/appointments/${id}/status`, statusData);
    return response.data;
}

export const inviteVisitor = async (inviteData) => {
    const response = await api.post('/appointments/invite', inviteData);
    return response.data;
}

// **Admin User Management**
// GET: Fetch all appointments for admin with filters
export const getAllAppointmentsAdmin = async (search = "", host = "All", startDate = "", endDate = "", statusFilter = "All Status") => {
    let url = `/appointments/admin/all?`;
    const params = new URLSearchParams();

    if (search && search.trim() !== '') {
        params.append('search', search);
    };
    if (host !== "All") {
        params.append('host', host);
    }
    if (startDate) {
        params.append('startDate', startDate);
    }
    if (endDate) {
        params.append('endDate', endDate);
    }
    if (statusFilter !== "All Status") {
        params.append('status', statusFilter);
    }

    const response = await api.get(`${url}${params.toString()}`);
    return response.data;
};

export const updateAppointmentStatusAdmin = async (id, data) => {
    const response = await api.put(`/appointments/${id}/status`, data);
    return response.data;
};

export const inviteVisitorAdmin = async (data) => {
    const response = await api.post(`/appointments/invite`, data);
    return response.data;
};

// GET: Admin fetch all passes in the system with optional filters
export const getAllPassesAdmin = async (hostId = 'All', search = '', startDate = '', endDate = '') => {
    // Changed path to match your appointmentRoutes.js!
    let url = `/appointments/passes/all?`; 
    const params = new URLSearchParams();
    
    if (search && search.trim() !== '') params.append('search', search);
    if (hostId && hostId !== 'All') params.append('hostId', hostId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${url}${params.toString()}`);
    return response.data;
};

// GET: Download a specific pass PDF
export const downloadPassPdf = async (passId) => {
    // Changed path to hit your existing router.get('/:id/badge') route!
    const response = await api.get(`/appointments/${passId}/badge`, { responseType: 'blob' });
    return response.data;
};