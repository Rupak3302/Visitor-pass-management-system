import api from './api';

// GET: Fetch Master Report Data
export const getMasterReportAdmin = async (search = '', hostId = 'All', securityId = 'All', startDate = '', endDate = '', status = 'All') => {
    let url = `/reports/master?`;
    const params = new URLSearchParams();
    
    if (search && search.trim() !== '') params.append('search', search);
    if (hostId && hostId !== 'All') params.append('hostId', hostId);
    if (securityId && securityId !== 'All') params.append('securityId', securityId); // NEW: Security Filter
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status && status !== 'All') params.append('status', status);
    
    const response = await api.get(`${url}${params.toString()}`);
    return response.data;
};