import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api"

const HostPanel = () => {

    const [ myVisitors, setMyVisitors ] = useState([]);
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const res = await api.get('/appointments')
                setMyVisitors(res.data);

            } catch (error) {
                console.error('Faild to fetch appointment');
                toast.error('Could not load your appointment');

            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handleUpdateStatus = async (appointmentId, newStatus) => {
        try {
            // this tell the backend to update the status
            const res = await api.put(`/appointments/${appointmentId}/status`, {
                status: newStatus
            });
            
            toast.success(`Appointment${newStatus} successfully!`);

            // this update the table locally so instantly turns green/red
            setMyVisitors((prevVisitor) =>
                prevVisitor.map((app) =>
                    app._id === appointmentId ? {...app, status: newStatus } : app
                )
            );
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || `Faild to ${newStatus} appointment`)
        }
    };

    if (loading) return <div className="p-4 text-center">Loading your appointments...</div>;

    return (
        <div className="space-y-6">

            {/* Top Action Bar */}
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">

                <div className="flex items-center gap-2 text-slate-800">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-bold">My Appointments</h2>
                </div>

            </div>

            <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
                <table className="w-full text-left border-collapse">

                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                            <th className="p-4">Visitor Name</th>
                            <th className="p-4">Purpose</th>
                            <th className="p-4">Time</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-300">

                        {myVisitors.map((appointment) => (
                            <tr key={appointment._id} className="hover:bg-slate-50 transition">
                                <td className="p-4 font-medium text-slate-900">
                                    {appointment.visitorId?.name || 'Unknown Visitor'}
                                </td>
                                <td className="p-4 text-slate-600">{appointment.purpose}</td>
                                <td className="p-4 text-slate-600">{appointment.time}</td>
                                <td className="p-4">
                                    <span className={`flex items-center w-fit gap-1 px-3 py-1 text-xs font-semibold rounded-full 
                                        ${appointment.status === 'approved' ? 'bg-green-300 text-green-700' : ''}
                                        ${appointment.status === 'pending' ? 'bg-yellow-300 text-yellow-700' : ''}
                                        ${appointment.status === 'completed' ? 'bg-slate-300 text-slate-600' : ''}
                                        ${appointment.status === 'rejected' ? 'bg-red-300 text-red-700' : ''}
                                    `}>
                                        {appointment.status === 'pending' && <Clock className="w-3 h-3" />}
                                        {appointment.status === 'approved' && <CheckCircle className="w-3 h-3"/>}
                                        {appointment.status }
                                    </span>
                                </td>

                                {/* only show the approve/reject button, if status is pending */}
                                <td className="p-4 text-right">

                                    {appointment.status === 'pending' ? (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                            onClick={() => handleUpdateStatus(appointment._id, 'approved')}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition">
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                            <button 
                                            onClick={() => handleUpdateStatus(appointment._id, 'rejected')}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">No actions</span>
                                    )}

                                </td>      
                            </tr>
                        ))}

                    </tbody>

                </table>
            </div>
        </div>
    );
};

export default HostPanel;