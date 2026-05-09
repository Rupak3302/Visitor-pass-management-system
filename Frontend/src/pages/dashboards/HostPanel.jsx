// import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
// import { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import api from "../../services/api"

// const HostPanel = () => {

//     const [ myVisitors, setMyVisitors ] = useState([]);
//     const [ loading, setLoading ] = useState(true)

//     useEffect(() => {
//         const fetchAppointments = async () => {
//             try {
//                 const res = await api.get('/appointments')
//                 setMyVisitors(res.data);

//             } catch (error) {
//                 console.error('Faild to fetch appointment');
//                 toast.error('Could not load your appointment');

//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAppointments();
//     }, []);

//     const handleUpdateStatus = async (appointmentId, newStatus) => {
//         try {
//             // this tell the backend to update the status
//             const res = await api.put(`/appointments/${appointmentId}/status`, {
//                 status: newStatus
//             });
            
//             toast.success(`Appointment${newStatus} successfully!`);

//             // this update the table locally so instantly turns green/red
//             setMyVisitors((prevVisitor) =>
//                 prevVisitor.map((app) =>
//                     app._id === appointmentId ? {...app, status: newStatus } : app
//                 )
//             );
//         } catch (error) {
//             console.error(error);
//             toast.error(error.response?.data?.message || `Faild to ${newStatus} appointment`)
//         }
//     };

//     if (loading) return <div className="p-4 text-center">Loading your appointments...</div>;

//     return (
//         <div className="space-y-6">

//             {/* Top Action Bar */}
//             <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">

//                 <div className="flex items-center gap-2 text-slate-800">
//                     <Calendar className="w-5 h-5 text-indigo-600" />
//                     <h2 className="text-lg font-bold">My Appointments</h2>
//                 </div>

//             </div>

//             <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
//                 <table className="w-full text-left border-collapse">

//                     <thead>
//                         <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
//                             <th className="p-4">Visitor Name</th>
//                             <th className="p-4">Purpose</th>
//                             <th className="p-4">Time</th>
//                             <th className="p-4">Status</th>
//                             <th className="p-4 text-right">Actions</th>
//                         </tr>
//                     </thead>

//                     <tbody className="divide-y divide-slate-300">

//                         {myVisitors.map((appointment) => (
//                             <tr key={appointment._id} className="hover:bg-slate-50 transition">
//                                 <td className="p-4 font-medium text-slate-900">
//                                     {appointment.visitorId?.name || 'Unknown Visitor'}
//                                 </td>
//                                 <td className="p-4 text-slate-600">{appointment.purpose}</td>
//                                 <td className="p-4 text-slate-600">{appointment.time}</td>
//                                 <td className="p-4">
//                                     <span className={`flex items-center w-fit gap-1 px-3 py-1 text-xs font-semibold rounded-full 
//                                         ${appointment.status === 'approved' ? 'bg-green-300 text-green-700' : ''}
//                                         ${appointment.status === 'pending' ? 'bg-yellow-300 text-yellow-700' : ''}
//                                         ${appointment.status === 'completed' ? 'bg-slate-300 text-slate-600' : ''}
//                                         ${appointment.status === 'rejected' ? 'bg-red-300 text-red-700' : ''}
//                                     `}>
//                                         {appointment.status === 'pending' && <Clock className="w-3 h-3" />}
//                                         {appointment.status === 'approved' && <CheckCircle className="w-3 h-3"/>}
//                                         {appointment.status }
//                                     </span>
//                                 </td>

//                                 {/* only show the approve/reject button, if status is pending */}
//                                 <td className="p-4 text-right">

//                                     {appointment.status === 'pending' ? (
//                                         <div className="flex justify-end gap-2">
//                                             <button 
//                                             onClick={() => handleUpdateStatus(appointment._id, 'approved')}
//                                             className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition">
//                                                 <CheckCircle className="w-4 h-4" /> Approve
//                                             </button>
//                                             <button 
//                                             onClick={() => handleUpdateStatus(appointment._id, 'rejected')}
//                                             className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
//                                                 <XCircle className="w-4 h-4" /> Reject
//                                             </button>
//                                         </div>
//                                     ) : (
//                                         <span className="text-sm text-slate-400">No actions</span>
//                                     )}

//                                 </td>      
//                             </tr>
//                         ))}

//                     </tbody>

//                 </table>
//             </div>
//         </div>
//     );
// };

// export default HostPanel;

// 

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Calendar, User, Briefcase, Search, Mail, Phone, Info } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const HostPanel = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // New States for Search and Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch ALL appointments for this host (not just pending)
  const fetchAppointments = async () => {
    try {
      // Removing the ?status=pending query gets all of them!
      const res = await api.get('/appointments');
      const data = res.data.appointments || res.data;
      setAppointments(data);
    } catch (error) {
      toast.error("Failed to load your appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    let rejectionReason = "";

    // If the host is rejecting, ask then fer a reason
    if (newStatus === 'rejected') {
      const reason = Window.prompt("Please provide a reason for rejection:");

      // If they click "Cancel" or leave it blank, then proceed with out the rejection
      if ( reason === null ) return; 
      rejectionReason = reason;
    }
    setProcessingId(id);
    try {
      const res = await api.put(`/appointments/${id}/status`, { 
        status: newStatus,
        rejectionReason: rejectionReason
      });
      
      toast.success(res.data.message || `Visit ${newStatus} successfully!`);
      
      // Instantly update the table without reloading the page
      setAppointments(prev => 
        prev.map(app => app._id === id ? { ...app, status: newStatus } : app)
      );
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update status`);
    } finally {
      setProcessingId(null);
    }
  };

  // --- DERIVED DATA (Searching & Filtering) ---
  
  // 1. Calculate Counts for the Summary Cards
  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    approved: appointments.filter(a => a.status === 'approved').length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  // 2. Filter the table data based on Search Term AND Status Dropdown
  const filteredAppointments = appointments.filter(app => {

    // Check Status
    const matchesStatus = statusFilter === "All" || app.status === statusFilter.toLowerCase();

    // Check Search by (Name, Email, or Phone)
    const searchLower = searchTerm.toLowerCase();
    const vName = app.visitorId?.name?.toLowerCase() || "";
    const vEmail = app.visitorId?.email?.toLowerCase() || "";
    const vPhone = app.visitorId?.phone?.toLowerCase() || "";
    
    const matchesSearch = vName.includes(searchLower) || 
                          vEmail.includes(searchLower) || 
                          vPhone.includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // Helper function to render colorful status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs">Rejected</span>;
      case 'completed': return <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">Completed</span>;
      default: return <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs animate-pulse">Pending</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
        <p className="text-slate-500 text-sm">Review and manage your visitor requests</p>
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No records found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Visitor Details</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition">
                    
                    {/* Visitor Column (Now includes Email & Phone) */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {app.visitorId?.photoUrl ? (
                          <img src={`http://localhost:5000/uploads/${app.visitorId.photoUrl}`} alt="visitor" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{app.visitorId?.name || 'Unknown Visitor'}</p>
                          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                             <p className="flex items-center gap-1"><Briefcase className="w-3 h-3"/> {app.visitorId?.company || 'N/A'}</p>
                             <p className="flex items-center gap-1"><Mail className="w-3 h-3"/> {app.visitorId?.email}</p>
                             <p className="flex items-center gap-1"><Phone className="w-3 h-3"/> {app.visitorId?.phone}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Purpose Column */}
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-md">
                        {app.purpose || 'Meeting'}
                      </span>
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
                        {app.visitTime}
                      </p>
                    </td>

                    {/* NEW Status Column */}
                    <td className="p-4">
                      {getStatusBadge(app.status)}
                      {/* Display the rejection reason if it exists! */}
                      {app.status === 'rejected' && app.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1 flex items-start gap-1 max-w-[150px]">
                          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" /> {app.rejectionReason}
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
                            className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm transition shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          
                          <button 
                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg font-bold text-sm transition shadow-sm"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 uppercase">
                           {app.status === 'approved' ? 'Pass Issued' : 'No Actions'}
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
    </div>
  );
};

export default HostPanel;