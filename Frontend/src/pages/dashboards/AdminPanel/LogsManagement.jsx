import React, { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, X, LogIn, LogOut, Clock, Users, Ticket } from 'lucide-react';
import { getAllLogsAdmin } from '../../../services/checklogApi';
import toast from 'react-hot-toast';

const LogsManagement = () => {
    // ---- STATE MANAGEMENT ----
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, inside: 0, exited: 0 });
    const [systemHosts, setSystemHosts] = useState([]); // For the dropdown
    const [systemSecurity, setSystemSecurity] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHost, setSelectedHost] = useState('All');
    const [selectedSecurity, setSelectedSecurity] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // ---- API CALLS ----
    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const data = await getAllLogsAdmin(searchTerm, selectedHost, selectedSecurity, startDate, endDate);
            if (data.success) {
                setLogs(data.logs);
                setStats(data.stats);
                
                // Only set hosts on initial load or if the host list is empty to prevent dropdown resetting
                if (data.hosts) {
                    setSystemHosts(data.hosts);
                }
                if (data.securityUsers) {
                    setSystemSecurity(data.securityUsers);
                }
                // if (systemHosts.length === 0 && data.hosts) {
                //     setSystemHosts(data.hosts);
                // }
            }
        } catch (error) {
            console.error("Error fetching check logs:", error);
            toast.error("Failed to load check logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchLogs(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedHost, selectedSecurity, startDate, endDate]);

    // ---- UI HELPERS ----
    const clearDateFilter = () => { setStartDate(''); setEndDate(''); };

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full relative">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Check Logs Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Audit trail of all visitor entries and exits</p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Logs</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                    </div>
                    <Users className="w-8 h-8 text-slate-200" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Logs</p>
                        <h3 className="text-2xl font-black text-blue-600">{stats.today}</h3>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-blue-100" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-green-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inside Now</p>
                        <h3 className="text-2xl font-black text-green-600">{stats.inside}</h3>
                    </div>
                    <LogIn className="w-8 h-8 text-green-100" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exited</p>
                        <h3 className="text-2xl font-black text-amber-600">{stats.exited}</h3>
                    </div>
                    <LogOut className="w-8 h-8 text-amber-100" />
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between z-20">
                
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search visitor name or passcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"/>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Host Dropdown Filter */}
                    <select value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)} className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="All">All Hosts</option>
                        {systemHosts.map((host) => (
                            <option key={host._id} value={host._id}>{host.name}</option>
                        ))}
                    </select>

                    {/* Security Dropdown Filter */}
                    <select value={selectedSecurity} onChange={(e) => setSelectedSecurity(e.target.value)} className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="All">All Security</option>
                        {systemSecurity.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        <span className="text-xs font-bold text-slate-400 uppercase mx-1">To</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        {(startDate || endDate) && <button onClick={clearDateFilter} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4 text-slate-500" /></button>}
                    </div>
                </div>
            </div>

            {/* LOGS SCROLLING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                <div className="overflow-auto flex-1 no-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                            <tr className="border-b text-left border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Visitor Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Host & Purpose</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Scanned By</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check-In / Check-Out</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium animate-pulse">Loading logs...</td></tr>
                            ) : logs.length > 0 ? logs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                    
                                    {/* 1. VISITOR DETAILS */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shadow-inner">
                                                {log.passId?.visitorId?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{log.passId?.visitorId?.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-medium text-slate-500">{log.passId?.visitorId?.phone}</span>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Ticket className="w-3 h-3"/> {log.passId?.passCode}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. HOST & PURPOSE */}
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-800">{log.passId?.appointmentId?.hostId?.name || 'System'}</p>
                                        <p className="text-xs font-medium text-slate-500 capitalize">{log.passId?.appointmentId?.purpose || 'Visit'}</p>
                                    </td>

                                    {/* 4. Scanned By (Security User) */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-700">
                                                {log.scannedBy?.name || 'Unknown Security'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* 5. TIMESTAMPS */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                                                <span>Check-In:</span>
                                                <span className="text-slate-700">{formatDate(log.checkInTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                                                <span>Check-Out:</span>
                                                <span className="text-slate-700">{formatDate(log.checkOutTime)}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 6. STATUS */}
                                    <td className="px-6 py-4 text-center">
                                        {!log.checkOutTime ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Inside
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">Exited</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">No check logs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogsManagement;