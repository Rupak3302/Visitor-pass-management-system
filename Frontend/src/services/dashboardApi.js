import api from './api';

export const getDashboardStatsAdmin = async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
};