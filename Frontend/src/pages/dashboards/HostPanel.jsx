import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Calendar, User, Briefcase, Search, Mail, Phone, Info, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { getAppointments, updateAppointmentStatus, inviteVisitor } from "../../services/appointmentApi";
import Navbar from "../../components/Navbar";

const HostPanel = () => {
  // States for appointments
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // States for Rescheduling an existing appointment
  const [ isRescheduleModalOpen, setIsRescheduleModalOpen ] = useState(false);
  const [ rescheduleApp, setRescheduleApp ] = useState(null);
  const [ rescheduleDate, setRescheduleDate ] = useState('');
  const [ rescheduleTime, setRescheduleTime ] = useState({ hour: '12', minute: '00', ampm: 'PM' });


  // Modal and Form States for directly invites
  const [ isInviteModalOpen, setIsInviteModalOpen ] = useState(false);
  const [ isInviting, setIsInviting ] = useState(false);
  const [ inviteForm, setInviteForm ] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    visitDate: '',
    visitTime: ''
  });

  // helper array for generate hours and minutes dropdowns
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // state the custom 12 hour time picker 
  const [ inviteTime, setInviteTime ] = useState({ hour: '', minute: '', ampm: '' });

  // New States for Search and Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ startDate, setStartDate ] = useState('');
  const [ endDate, setEndDate ] = useState(''); 

  // Fetch data from API with search and filter parameters
  const fetchAppointments = async () => {
    try {
      // Pass the search and status filter directly from the service api 
      const data = await getAppointments(searchTerm, statusFilter, startDate, endDate);

      const appointmentArray = data.appointments || data; // Handle both { appointments: [...] } and [...] responses
      setAppointments(appointmentArray);

    } catch (error) {
      console.error('Failed to fetch appointments', error);
      toast.error("Failed to load your appointments");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle time changes
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

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setProcessingId(rescheduleApp._id);

    try {
      // // convert the time to 12-hour format
      // let hr = parseInt(rescheduleTime.hour);
      // if (rescheduleTime.ampm === "PM" && hr !== 12) {
      //   hr += 12;
      // } else if (rescheduleTime.ampm === "AM" && hr === 12) {
      //   hr = 0;
      // }

      // const formattedHour = hr.toString().padStart(2, "0");
      const finalTimestr = `${rescheduleTime.hour}:${rescheduleTime.minute} ${rescheduleTime.ampm}`;

      await updateAppointmentStatus(rescheduleApp._id, {
        status: 'approved',
        visitDate: rescheduleDate,
        visitTime: finalTimestr
      });

      toast.success("Appointment rescheduled successfully!");
      setIsRescheduleModalOpen(false); // close the popup

      // Refresh the table so new approved appointment shows up instantly
      fetchAppointments();
    } catch (error) {
      console.error('Reschedule Error', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');    
    } finally {
      setProcessingId(null);
    }
  }

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await inviteVisitor(inviteForm);

      toast.success("Visitor invited and Pass generated successfully!");
      setIsInviteModalOpen(false); // close the popup

      // Clear the form
      setInviteForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        visitDate: '',
        visitTime: ''
      });

      setInviteTime({ hour: '12', minute: '00', ampm: 'PM' });

      // Refresh the table so new approved appointment shows up instantly
      fetchAppointments();
    } catch (error) {
      console.error('Invite Error', error);
      toast.error(error.response?.data?.message || 'Failed to invite visitor');
    } finally {
      setIsInviting(false);
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
  }, [searchTerm, statusFilter, startDate, endDate]);

  const handleStatusUpdate = async (id, newStatus) => {
    let rejectionReason = "";

    // If the host is rejecting, ask then fer a reason
    if (newStatus === 'rejected') {
      const reason = window.prompt("Please provide a reason for rejection:");

      // If they click "Cancel" or leave it blank, then proceed with out the rejection
      if ( reason === null ) return; 
      rejectionReason = reason;
    }

    // If you canceled , ask them to provide a reason
    if (newStatus === 'cancelled') {
      const reason = window.prompt("Please provide a reason for cancellation:");
      if ( reason === null ) return; 
      rejectionReason = reason;
    }

    setProcessingId(id);

    try {
      // pass the id and the data object from the service api file
      const res = await updateAppointmentStatus(id, { 
        status: newStatus,
        rejectionReason: rejectionReason
      });
      
      toast.success(res.message || `Visit ${newStatus} successfully!`);
      
      // Instantly update the table without reloading the page
      setAppointments(prev => 
        prev.map(app => app._id === id ? { ...app, status: newStatus, rejectionReason: rejectionReason } : app)
      );
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update status`);
    } finally {
      setProcessingId(null);
    }
  };

  // Calculate Counts for the Summary Cards
  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  // Helper function to render colorful status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">Rejected</span>;
      case 'completed': return <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">Completed</span>;
      case 'cancelled': return <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-xs">Cancelled</span>
      default: return <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs animate-pulse">Pending</span>;
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
    <div className="space-y-6 mt-6">
      
      {/* Header & Invite Button */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
          <p className="text-slate-500 text-sm">Review and manage your visitor requests</p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Invite
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
          <p className="text-2xl font-black text-slate-800">{counts.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
          <p className="text-2xl font-black text-amber-600">{counts.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-green-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Approved</p>
          <p className="text-2xl font-black text-green-600">{counts.approved}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Rejected</p>
          <p className="text-2xl font-black text-red-600">{counts.rejected}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500 hidden lg:block">
          <p className="text-xs font-bold text-slate-500 uppercase">Completed</p>
          <p className="text-2xl font-black text-blue-600">{counts.completed}</p>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-6">
        
        {/* Search Bar */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>

        {/* Filtering by date range*/}
        <div className="flex items-center gap-3 lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">From</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none coursor-pointer focus:text-blue-600" 
            />
          </div>

          <span className="text-slate-300 font-medium">—</span>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">To</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none coursor-pointer focus:text-blue-600" 
            />
          </div>

          {/* clear date filter reset button */}
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 w-full sm:w-auto"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Filter:</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer font-medium outline-none"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse"> Loading your dashboard...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center"> 
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No records found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative bg-white rounded-b-xl scrollbar-hover-only">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-xs border-b border-slate-200 font-bold tracking-wider uppercase text-slate-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Visitor Details</th>
                  <th className="px-6 py-4 font-medium">Purpose Details</th>
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition">
                    
                    {/* Visitor Column (includes Email & Phone) */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {app.visitorId?.photoUrl ? (
                          <img src={getVisitorPhotoUrl(app.visitorId.photoUrl)} alt="visitor" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{app.visitorId?.name || 'Unknown Visitor'}</p>
                          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                             <p className="flex items-center gap-1"><Mail className="w-3 h-3"/> {app.visitorId?.email}</p>
                             <p className="flex items-center gap-1"><Phone className="w-3 h-3"/> {app.visitorId?.phone}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Purpose Column (include Purpose, Company & Notes)*/}
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-md">
                        {app.purpose}
                      </span>
                      {app.visitorId?.company && (
                        <p className="flex items-center gap-1 text-sx font-semibold text-slate-600 mt-2">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {app.visitorId.company}
                        </p>
                      )}
                      {app.notes && (
                        <p className="text-xs text-slate-500 mt-2 max-w-[150px] truncate" title={app.notes}>
                          "{app.notes}"
                        </p>
                      )}
                    </td>

                    {/* Date/Time Column */}
                    <td className="p-4">
                      <p className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" /> 
                        {new Date(app.visitDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatTime(app.visitTime)}
                      </p>
                    </td>

                    {/* Status Column (include rejection reason)*/}
                    <td className="p-4">
                      {getStatusBadge(app.status)}
                      {/* Display the rejection reason if it exists! */}
                      {app.status === 'rejected' && app.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 flex items-start gap-1 max-w-[150px]">
                          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" /> {app.rejectionReason}
                        </p>
                      )}
                      {app.status === 'cancelled' && app.rejectionReason && (
                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1 max-w-[150px]">
                          <Info className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /> {app.rejectionReason}
                        </p>
                      )}
                    </td>

                    {/* Action Buttons Column */}
                    <td className="p-4 text-right">
                      {processingId === app._id ? (
                        <span className="text-sm font-bold text-blue-600 animate-pulse">Processing...</span>
                      ) : app.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(app._id, 'approved')}
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>

                          <button 
                            onClick={() => {
                              setRescheduleApp(app);
                              setRescheduleDate(app.visitDate ? app.visitDate.split('T')[0] : '');
                              setIsRescheduleModalOpen(true);
                            }}
                            className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                            <Calendar className="w-4 h-4" /> Reschedule
                          </button>
                          
                          <button 
                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 uppercase">
                            {app.status === 'approved' ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Pass Issued</span>
                                <button
                                  onClick={() => handleStatusUpdate(app._id, 'cancelled')}
                                  className="flex items-center gap-0.5 text-xs font-bold text-red-500 hover:text-red-700 
                                  bg-transparent border-none transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  CANCEL VISIT
                                </button>
                              </div>
                            ) : (
                              app.status === 'cancelled' ? (
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cancelled</span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No Action</span>
                              )
                            )}  
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Visitor Modal Part */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Directly Invite a Visitor</h3>
                  <p className="text-sm text-slate-500">This will automatically approve them and send a QR Pass.</p>
              </div>
              <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                  <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInviteSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Row 1 */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                      <input type="text" required value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email *</label>
                      <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  {/* Row 2 */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone *</label>
                      <input type="text" required value={inviteForm.phone} onChange={(e) => setInviteForm({...inviteForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                      <input type="text" value={inviteForm.company} onChange={(e) => setInviteForm({...inviteForm, company: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose of Visit *</label>
                      <input type="text" required placeholder="e.g. Interview, Meeting, Maintenance" value={inviteForm.purpose} onChange={(e) => setInviteForm({...inviteForm, purpose: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  {/* Row 4 */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                      <input type="date" required value={inviteForm.visitDate} onChange={(e) => setInviteForm({...inviteForm, visitDate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time *</label>
                      <div className="flex items-center gap-1.5">
                        {/* hour selector */}
                        <select
                          value={inviteTime.hour}
                          onChange={(e) => handleInviteTimeChange('hour', e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white text-center appearance-none cursor-pointer"
                          >
                            <option value="" disabled>--</option>
                          {hours.map(h => <option key={h}>{h}</option>)} 
                        </select>
                        <span className="text-slate-400 font-bold">:</span>
                        
                        {/* minute selector */}
                        <select 
                          value={inviteTime.minute}
                          onChange={(e) => handleInviteTimeChange('minute', e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white text-center appearance-none cursor-pointer"
                          >
                            <option value="" disabled>--</option>
                          {minutes.map(m => <option key={m}>{m}</option>)}
                        </select>

                        {/* AM/PM selector */}
                        <select 
                          value={inviteTime.ampm}
                          onChange={(e) => handleInviteTimeChange('ampm', e.target.value)}
                          className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-white text-center font-semibold appearance-none cursor-pointer"
                          >
                          <option value="" disabled>--</option>
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                      Cancel
                  </button>
                  <button type="submit" disabled={isInviting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70">
                      {isInviting ? 'Sending Invite...' : 'Send Invite'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Model Part */}
      {isRescheduleModalOpen && rescheduleApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
            {/* Header Info */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Reschedule Appointment</h3>
                  <p className="text-xs text-slate-500">For: <span className="font-semibold text-slate-700">{rescheduleApp.visitorId?.name}</span></p>
              </div>
              <button onClick={() => setIsRescheduleModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                  <X className="w-6 h-6" />
              </button>
            </div>

            {/* Setup Selection Form */}
            <form onSubmit={handleRescheduleSubmit} className="p-6">
              <div className="flex flex-col gap-4 mb-6">

                {/* Choose New Calendar Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Date *</label>
                  <input 
                      type="date" 
                      required 
                      value={rescheduleDate} 
                      onChange={(e) => setRescheduleDate(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                  />
                </div>

                {/* Custom 12-Hour Dropdowns Selector Block */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Time *</label>
                  <div className="flex items-center gap-1.5">
                    <select
                        value={rescheduleTime.hour}
                        onChange={(e) => setRescheduleTime({...rescheduleTime, hour: e.target.value})}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white text-center appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-slate-400 font-bold">:</span>
                    <select
                        value={rescheduleTime.minute}
                        onChange={(e) => setRescheduleTime({...rescheduleTime, minute: e.target.value})}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white text-center appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                        value={rescheduleTime.ampm}
                        onChange={(e) => setRescheduleTime({...rescheduleTime, ampm: e.target.value})}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 bg-white text-center appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

                {/* Options Submission Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsRescheduleModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm">
                    Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
    </div>
  );
};

export default HostPanel;