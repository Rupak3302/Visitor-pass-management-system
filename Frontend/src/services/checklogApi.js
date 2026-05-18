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








// import api from './api';

// export const scanVisitorPass = async (passCode) => {
//     const response = await api.post('/checklogs/scan', { passCode });
//     return response.data; 
// }

// export const getAllLogs = async () => {
//     const response = await api.get('/checklogs');
//     return response.data; 
// }