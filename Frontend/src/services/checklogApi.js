import api from './api';

export const scanVisitorPass = async (qrData, passCode = null) => {
    const payload = passCode ? { passCode } : { qrData };
    const response = await api.post('/checklogs/scan', payload);
    return response.data;
}

export const getTodayLogs = async () => {
    const response = await api.get('/checklogs/today');
    return response.data;
}

// ** Admin Management Section **

// GET: Admin fetch all check logs with filters
export const getAllLogsAdmin = async (search = '', hostId = 'All', securityId = 'All', startDate = '', endDate = '') => {
    let url = `/checklogs/admin/all?`;
    const params = new URLSearchParams();
    
    if (search && search.trim() !== '') params.append('search', search);
    if (hostId && hostId !== 'All') params.append('hostId', hostId);
    if (securityId && securityId !== 'All') params.append('securityId', securityId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${url}${params.toString()}`);
    return response.data;
};