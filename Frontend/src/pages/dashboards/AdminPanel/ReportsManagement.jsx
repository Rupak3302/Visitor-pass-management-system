import React, { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, X, Download, FileSpreadsheet } from 'lucide-react';
import { getMasterReportAdmin } from '../../../services/reportApi';
import toast from 'react-hot-toast';

const ReportsManagement = () => {
    const [reports, setReports] = useState([]);
    const [systemHosts, setSystemHosts] = useState([]);
    const [systemSecurity, setSystemSecurity] = useState([]); // NEW: Security list
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHost, setSelectedHost] = useState('All');
    const [selectedSecurity, setSelectedSecurity] = useState('All'); // NEW: Security selected
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const data = await getMasterReportAdmin(searchTerm, selectedHost, selectedSecurity, startDate, endDate, selectedStatus);
            if (data.success) {
                setReports(data.reports);
                if (systemHosts.length === 0 && data.hosts) setSystemHosts(data.hosts);
                if (systemSecurity.length === 0 && data.securityUsers) setSystemSecurity(data.securityUsers);
            }
        } catch (error) {
            toast.error("Failed to load reports");
        } finally {
            setIsLoading(false);
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

    const formatDateTime = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);

        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchReports(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedHost, selectedSecurity, startDate, endDate, selectedStatus]);

    // ---- CSV EXPORT LOGIC ----
    const exportToCSV = () => {
        if (reports.length === 0) {
            toast.error("No data to export!");
            return;
        }

        // Updated Headers
        const headers = [
            "No.", "Visitor Name", "Email", "Phone", "Company", "Purpose", "Type", "Notes", 
            "Visit Date", "Visit Time", "Host Name", "Host Email", 
            "Appt Status", "Reject/Cancel Reason", 
            "Pass Code", "Pass Status", 
            "Security Name", "Security Email", // Added Security
            "Check-In Time", "Check-Out Time"
        ];

        const csvRows = reports.map((row, index) => {
            return [
                `"${index + 1}"`,
                `"${row.visitor?.name || ''}"`,
                `"${row.visitor?.email || ''}"`,
                `"\t${row.visitor?.phone || ''}"`, // Added \t to prevent Excel scientific notation!
                `"${row.visitor?.company || ''}"`,
                `"${row.appointment?.purpose || ''}"`,
                `"${row.visitor?.registeredBy === 'admin' || row.visitor?.registeredBy === 'host' ? 'Invited' : 'Pre-Registered'}"`,
                `"${row.appointment?.notes || ''}"`,
                `"${row.appointment?.visitDate ? new Date(row.appointment.visitDate).toLocaleDateString('en-GB') : ''}"`,
                `"${row.appointment?.visitTime || ''}"`,
                `"${row.host?.name || ''}"`,
                `"${row.host?.email || 'No Email'}"`, // Swapped Phone for Email
                `"${row.appointment?.status || ''}"`,
                `"${row.appointment?.rejectionReason || ''}"`,
                `"${row.pass?.passCode || 'N/A'}"`,
                `"${row.pass?.status || 'N/A'}"`,
                `"${row.checkLog?.scannedBy?.name || 'N/A'}"`, 
                `"${row.checkLog?.scannedBy?.email || 'N/A'}"`,
                `"${row.checkLog?.checkInTime ? new Date(row.checkLog.checkInTime).toLocaleString() : 'Not Checked In'}"`,
                `"${row.checkLog?.checkOutTime ? new Date(row.checkLog.checkOutTime).toLocaleString() : 'Not Checked Out'}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `SecurePass_Master_Report_${new Date().toLocaleDateString('en-GB')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported Successfully!");
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Master Reports</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Complete system data grid and CSV exports</p>
                </div>
                <button onClick={exportToCSV} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-grow min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search visitor name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"/>
                </div>

                <select value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All">All Hosts</option>
                    {systemHosts.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>

                {/* NEW SECURITY DROPDOWN */}
                <select value={selectedSecurity} onChange={(e) => setSelectedSecurity(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All">All Security</option>
                    {systemSecurity.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>

                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="All">All Status</option>
                    <option value="pending">Pending Appts</option>
                    <option value="approved">Approved Appts</option>
                    <option value="rejected">Rejected Appts</option>
                    <option value="cancelled">Cancelled Appts</option>
                </select>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                    <span className="text-xs font-bold text-slate-400 uppercase mx-1">To</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                    {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('');}} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4 text-slate-500" /></button>}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[500px]">
                <div className="overflow-auto flex-1 relative">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="sticky top-0 bg-slate-800 text-white z-10">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700 w-12 text-center">No.</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700">Visitor Info</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700">Visit Details</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700">Host Info</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700">Appt Status</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700">Pass Details</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-r border-slate-700 flex items-center gap-1.5"> Security Details</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Check Logs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                            {isLoading ? (
                                <tr><td colSpan="8" className="px-6 py-16 text-center animate-pulse">Loading mega report...</td></tr>
                            ) : reports.length > 0 ? reports.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-slate-500 bg-slate-50/50">{i + 1}</td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <p className="font-bold text-slate-900">{row.visitor?.name}</p>
                                        <p className="text-xs text-slate-500">{row.visitor?.email} • {row.visitor?.phone}</p>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <p className="font-medium">{new Date(row.appointment?.visitDate).toLocaleDateString('en-GB')} at {formatTime(row.appointment?.visitTime)}</p>
                                        <p className="text-xs text-slate-500 capitalize">{row.appointment?.purpose} • {row.visitor?.company || 'Personal'}</p>
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <p className="font-bold">{row.host?.name}</p>
                                        <p className="text-xs text-slate-500">{row.host?.email || 'No email'}</p> {/* Swapped phone for email */}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${row.appointment?.status === 'approved' ? 'bg-green-100 text-green-700' : row.appointment?.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {row.appointment?.status}
                                        </span>
                                        {row.appointment?.rejectionReason && <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={row.appointment.rejectionReason}>Reason: {row.appointment.rejectionReason}</p>}
                                    </td>
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        {row.pass ? (
                                            <>
                                                <p className="font-black text-blue-600 tracking-wider">{row.pass.passCode}</p>
                                                <p className="text-xs uppercase font-bold text-slate-400">{row.pass.status}</p>
                                            </>
                                        ) : <span className="text-slate-400 text-xs font-bold uppercase">No Pass</span>}
                                    </td>
                                    {/* NEW SECURITY DETAILS COLUMN */}
                                    <td className="px-4 py-3 border-r border-slate-100">
                                        {row.checkLog && row.checkLog.scannedBy ? (
                                            <>
                                                <p className="font-bold text-slate-800">{row.checkLog.scannedBy.name}</p>
                                                <p className="text-xs text-slate-500">{row.checkLog.scannedBy.email}</p>
                                            </>
                                        ) : <span className="text-slate-400 text-xs font-medium">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.checkLog ? (
                                            <div className="text-xs">
                                                <p><span className="font-bold text-green-600">IN:</span> {formatDateTime(row.checkLog.checkInTime).toLocaleString('en-GB')}</p>
                                                {row.checkLog.checkOutTime ? (
                                                    <p><span className="font-bold text-amber-600">OUT:</span> {formatDateTime(row.checkLog.checkOutTime).toLocaleString('en-GB')}</p>
                                                ) : (
                                                    <p className="text-blue-500 font-bold animate-pulse">STILL INSIDE</p>
                                                )}
                                            </div>
                                        ) : <span className="text-slate-400 text-xs font-medium">—</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="7" className="px-6 py-16 text-center text-slate-500 font-medium">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsManagement;