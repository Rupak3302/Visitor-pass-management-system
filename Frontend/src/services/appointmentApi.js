import api from './api';


export const getAppointments = async (search = "", status = "All") => {

    // base search url
    let url = `/appointments?search=${search}`;

    //the status filter if it is not "All"
    if (status !== "All") {
        url += `&status=${status}`;
    }

    // the urs looks like /appointments?search=John&status=Approved
    const response = await api.get(url);
    return response.data;
};


export const updateAppointmentStatus = async (id, statusData) => {
    const response = await api.put(`/appointments/${id}/status`, statusData);
    return response.data;
}