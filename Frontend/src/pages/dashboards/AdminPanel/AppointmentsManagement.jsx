import React, { useState, useEffect } from 'react';
import { Search, CalendarIcon, Filter, X, CheckCircle, XCircle, Clock, CalendarDays, Plus, Briefcase, Mail, Phone, AlertCircle, CalendarClock } from 'lucide-react';
import { getAllAppointmentsAdmin, updateAppointmentStatusAdmin, inviteVisitorAdmin } from '../../../services/appointmentApi';
import { getAllUsers } from '../../../services/usersApi';
import { getVisitorPhotoUrl } from '../../../services/imageService';
import toast from 'react-hot-toast';

const AppointmentsManagement = () => {
    // ---- STATE MANAGEMENT ----
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [tableHosts, setTableHosts] = useState([]); // All hosts for the dropdown
    
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHost, setSelectedHost] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');

    // Modals & Froms
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({ id: null, date: '', time: '' });
    const [processingId, setProcessingId] = useState(null);


    // Invite form state
    const [systemHosts, setSystemHosts] = useState([]); // All hosts for the dropdown
    const [isInviting, setIsInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState({ 
        name: '', email: '', phone: '', company: '', purpose: '', visitDate: '', visitTime: '', hostId: ''
    });

    // helper array for generate hours and minutes dropdowns
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const [inviteTime, setInviteTime] = useState({ hour: '', minute: '', ampm: '' });

    // ---- API CALLS ----
    const fetchAppointments = async () => {
        try {
            const data = await getAllAppointmentsAdmin(searchTerm, selectedHost, startDate, endDate, statusFilter);
            if (data.success) {
                setAppointments(data.appointments);
                setStats(data.stats);
                
                // Extract unique hosts dynamically for the dropdown
                if (tableHosts.length === 0 && data.appointments.length > 0) {
                    const uniqueHosts = [...new Set(data.appointments
                        .filter(app => app.hostId && app.hostId.name)
                        .map(app => app.hostId.name)
                    )];
                    setTableHosts(uniqueHosts);
                }
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);            
        }
    };

    useEffect(() => {
        // Fetch imediately when the page loads, search or filter changes
        fetchAppointments();

        // Set up interval to fetch appointments every 5 seconds
        const interval = setInterval(fetchAppointments, 5000);

        // Clean up the interval on component unmount
        return () => {
          clearInterval(interval);
        };
    }, [searchTerm, selectedHost, startDate, endDate, statusFilter]);

    // Fetch system hosts for the invite form dropdown
    const fetchHostsForInvite = async () => {
        try {
            const response = await getAllUsers('host', ''); // Fetching all users with their roles
            const responseData = response.data ? response.data : response;

            if (responseData && responseData.success) {
                setSystemHosts(response.users);
            }
        } catch (error) {
            console.error("Error fetching system hosts:", error);
        }
    };

    // ACTION HANDLERS
    const handleStatusUpdate = async (id, newStatus, extraData = {}) => {
        let reason = '';

        if (newStatus === 'rejected') {
            reason = window.prompt("Please provide a reason for rejection:");
            if (reason === null) return; // User cancelled the prompt
        }
        if (newStatus === 'cancelled') {
            reason = window.prompt("Please provide a reason for cancellation:");
            if (reason === null) return; // User cancelled the prompt
        }

        setProcessingId(id);

        try {
            const payload = { status: newStatus, rejectionReason: reason, ...extraData };
            const response = await updateAppointmentStatusAdmin(id, payload);
            if (response.success) {
                toast.success(`Appointment ${newStatus} successfully!`);
                fetchAppointments(); // Refresh the table instantly
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRescheduleSubmit = async (id) => {
        e.preventDefault();
        await handleStatusUpdate(rescheduleData.id, 'rescheduled', { visitDate: rescheduleData.date, visitTime: rescheduleData.time });
        setIsRescheduleModalOpen(false);
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();

        // Loading state to disable the button
        setIsInviting(true);
        try {
            // const finalTime = `${inviteTime.hour}:${inviteTime.minute} ${inviteTime.ampm}`;
            // const payload = { ...inviteForm, visitTime: finalTime };
            const payload =  {...inviteForm};

            const response = await inviteVisitorAdmin(payload);

            if (response && response.message) {
                toast.success("Visitor invited successfully!");
                setIsInviteModalOpen(false);
                
                setInviteForm({ name: '', email: '', phone: '', company: '', purpose: '', visitDate: '', visitTime: '', hostId: '' });
                setInviteTime({ hour: '12', minute: '00', ampm: 'PM' });
                fetchAppointments(); // Refresh the table instantly
            }
            
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to invite visitor");            
        } finally {
            setIsInviting(false);
        }   
    };

      const handleInviteTimeChange = (field, value) => {
    const updatedTime = { ...inviteTime, [field]: value };
    setInviteTime(updatedTime);

    // // convert the time to 24-hour format
    // let hr = parseInt(updatedTime.hour);
    // if (updatedTime.ampm === "PM" && hr !== 12) {
    //   hr += 12;
    // } else if (updatedTime.ampm === "AM" && hr === 12) {
    //   hr = 0;
    // }

    // const formattedHour = hr.toString().padStart(2, "0");
    const finalTimestr = `${updatedTime.hour}:${updatedTime.minute} ${updatedTime.ampm}`;

    // save the time to the form
    setInviteForm(prev => ({ ...prev, visitTime: finalTimestr }));
  }

    // UI HELPERS
    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Approved</span>;
            case 'pending': return <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">Pending</span>;
            case 'rejected': return <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Rejected</span>;
            case 'completed': return <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Completed</span>;
            case 'cancelled': return <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">Cancelled</span>;
            default: return <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
        }
    };

    // Helper function to format date and time
    const formatTime = (timeString) => {
        if (!timeString) return '--:--';

        if (timeString.toUpperCase().includes('AM') || timeString.toUpperCase().includes('PM')) {
            return timeString; // Already in 12-hour format
        }

        // Split the HH:MM format into hours and minutes
        const [hourString, minute] = timeString.split(':');
        let hour = parseInt(hourString, 10);

        // Convert to 12-hour format
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12; 
        hour = hour ? hour : 12; // convert 0 to 12

        // Add leading zero if necessary
        const formattedHour = hour < 10 ? `0${hour}` : hour;

        // Return the formatted time: HH:MM AM/PM
        return `${formattedHour}:${minute} ${ampm}`;
    };


    return (
        <div className="flex flex-col h-full relative">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">System Appointments</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Master override controls for all host schedules and visitor passes</p>
                </div>
                <button 
                    onClick={() => { fetchHostsForInvite(); setIsInviteModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/30"
                >
                    <Plus className="w-5 h-5" />
                    Invite
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
                    <h3 className="text-2xl font-black text-amber-600">{stats.pending}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-green-500 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approved</p>
                    <h3 className="text-2xl font-black text-green-600">{stats.approved}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rejected</p>
                    <h3 className="text-2xl font-black text-red-600">{stats.rejected}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                    <h3 className="text-2xl font-black text-blue-600">{stats.completed}</h3>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full xl:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                </div>

                <div className="flex flex-col md:flex-row w-full xl:w-auto gap-4 items-center">
                    
                    {/* Date Range Picker */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        <span className="text-xs font-bold text-slate-400 uppercase mx-1">To</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        {(startDate || endDate) && (
                            <button onClick={clearDateFilter} className="p-1 hover:bg-slate-200 rounded-full transition-colors ml-1">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        )}
                    </div>

                    {/* Host Dropdown */}
                    <div className="relative flex items-center gap-2 w-full md:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hidden md:block" />
                        <select 
                            value={selectedHost}
                            onChange={(e) => setSelectedHost(e.target.value)}
                            className="w-full md:w-40 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="All">All Hosts</option>
                            {tableHosts.map((hostName, index) => (
                                <option key={index} value={hostName}>{hostName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2 w-full md:w-auto">

                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="All Status">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* APPOINTMENTS SCROLLING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                {loading && appointments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-medium animate-pulse"> Loading your dashboard...</div>
                ) : appointments.length === 0 ? (
                  <div className="p-12 text-center"> 
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No records found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                    <div className="overflow-auto flex-1 no-scrollbar relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                                <tr className="border-b text-left border-slate-200">
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Visitor Details</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Purpose</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Approved By/Host</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Visit Date & Time</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.length > 0 ? appointments.map((app) => (
                                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">

                                        {/* 1. VISITOR DETAILS */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {app.visitorId?.photoUrl ? (
                                                    <img src={getVisitorPhotoUrl(app.visitorId.photoUrl)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner">
                                                        {app.visitorId?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{app.visitorId?.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-slate-500">
                                                        <Mail className="w-3 h-3 text-slate-400" /> 
                                                        <span className="truncate max-w-[150px]">{app.visitorId?.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-slate-500">
                                                        <Phone className="w-3 h-3 text-slate-400" /> 
                                                        <span>{app.visitorId?.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* 2. PURPOSE DETAILS */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-md max-w-fit border border-blue-100">
                                                    {app.purpose}
                                                </span>
                                                {app.visitorId?.company && (
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                                                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="truncate max-w-[120px]">{app.visitorId.company}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* 3. Approved By / Host Name */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-800">{app.hostId?.name || 'Unassigned'}</span>
                                        </td>

                                        {/* 4. VISIT DATE & TIME */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {new Date(app.visitDate).toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <p className="text-sm font-medium text-slate-500">
                                                    {formatTime(app.visitTime)}
                                                </p>
                                            </div>
                                        </td>

                                        {/* 4. STATUS / REASONS */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getStatusBadge(app.status)}
                                            {(app.status === 'rejected' || app.status === 'cancelled') && app.rejectionReason && (
                                                <div className="flex items-start gap-1 mt-2 text-red-500 text-[10px] font-medium leading-tight max-w-[150px]">
                                                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                    <span className="italic">"{app.rejectionReason}"</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* 5. ACTIONS (Matching Host Panel) */}
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            {app.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleStatusUpdate(app._id, 'approved')} 
                                                        disabled={processingId === app._id}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 bg-white text-green-600 border border-green-200 rounded-lg text-xs font-bold transition-all shadow-sm ${processingId === app._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
                                                    >
                                                        {processingId === app._id ? (
                                                            <span className="flex items-center gap-1 animate-pulse">Processing...</span>
                                                        ) : (
                                                            <><CheckCircle className="w-3.5 h-3.5" /> Approve</>
                                                        )}
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => { setRescheduleData({id: app._id, date: '', time: ''}); setIsRescheduleModalOpen(true); }} 
                                                        disabled={processingId === app._id}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 bg-white text-amber-600 border border-amber-200 rounded-lg text-xs font-bold transition-all shadow-sm ${processingId === app._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-50'}`}
                                                    >
                                                        <CalendarDays className="w-3.5 h-3.5" /> Reschedule
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleStatusUpdate(app._id, 'rejected')} 
                                                        disabled={processingId === app._id}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm ${processingId === app._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'}`}
                                                    >
                                                        {processingId === app._id ? (
                                                            <span className="flex items-center gap-1 animate-pulse">Processing...</span>
                                                        ) : (
                                                            <><XCircle className="w-3.5 h-3.5" /> Reject</>
                                                        )}
                                                    </button>
                                                </div>

                                            ) : app.status === 'approved' ? (
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">PASS ISSUED</span>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(app._id, 'cancelled')} 
                                                        disabled={processingId === app._id}
                                                        className={`flex items-center gap-1 text-red-500 text-[11px] font-bold transition-colors ${processingId === app._id ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:text-red-700'}`}
                                                    >
                                                        <X className="w-3 h-3" /> 
                                                        {processingId === app._id ? 'CANCELLING...' : 'CANCEL VISIT'}
                                                    </button>
                                                </div>

                                            ) : app.status === 'cancelled' ? (
                                                <span className="text-[10px] font-bold text-slate-400 tracking-wider mr-2">CANCELLED</span>

                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400 tracking-wider mr-2">NO ACTION</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    hy
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- ADMIN INVITE MODAL --- */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800">Invite Visitor (Admin Override)</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="p-6">
                            <div className="space-y-4 mb-6">
                                {/* Host Assigned */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Host Assigned To *</label>
                                    <select required value={inviteForm.hostId} onChange={(e) => setInviteForm({...inviteForm, hostId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="" disabled>Select a Host...</option>
                                        {systemHosts.map(host => <option key={host._id} value={host._id}>{host.name} ({host.email})</option>)}
                                    </select>
                                </div>
                                {/* Name & Email */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                                        <input required type="text" value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email *</label>
                                        <input required type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                </div>
                                {/* Phone & Company */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone *</label>
                                        <input required type="tel" value={inviteForm.phone} onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                                        <input type="text" value={inviteForm.company} onChange={(e) => setInviteForm({...inviteForm, company: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                </div>
                                {/* Purpose */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose of Visit *</label>
                                    <input required type="text" placeholder="e.g. Interview, Meeting, Maintenance" value={inviteForm.purpose} onChange={(e) => setInviteForm({...inviteForm, purpose: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                                {/* Date & Custom Time Picker */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                                        <input required type="date" value={inviteForm.visitDate} onChange={(e) => setInviteForm({...inviteForm, visitDate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time *</label>
                                        <div className="flex items-center gap-1.5">
                                            <select value={inviteTime.hour} onChange={e => handleInviteTimeChange('hour', e.target.value)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-center font-medium">
                                                <option value="" disabled>--</option>
                                            {hours.map(h => <option key={h}>{h}</option>)}
                                            </select>
                                            <span className="text-slate-400 font-black">:</span>
                                            <select value={inviteTime.minute} onChange={e => handleInviteTimeChange('minute', e.target.value)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-center font-medium">
                                                <option value="" disabled>--</option>
                                            {minutes.map(m => <option key={m}>{m}</option>)}
                                            </select>
                                            <select value={inviteTime.ampm} 
                                            onChange={e => handleInviteTimeChange('ampm', e.target.value)} className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer text-center font-medium">
                                                <option value="" disabled>--</option>
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div> 
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={isInviting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70">
                                    {isInviting ? 'Sending Invite...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- RESCHEDULE MODAL --- */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-black text-slate-800">Reschedule Appointment</h2>
                            <button onClick={() => setIsRescheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleRescheduleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Date</label>
                                    <input required type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Time</label>
                                    <input required type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-md shadow-amber-500/30">Confirm Reschedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsManagement;