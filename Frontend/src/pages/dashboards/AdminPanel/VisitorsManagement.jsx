import React, { useState, useEffect } from 'react';
import { Search, Users, UserPlus, Send, Filter, X, FileDown, Calendar, Clock } from 'lucide-react';
import { getAllVisitorsAdmin } from '../../../services/visitorApi';


const VisitorsManagement = () => {
    // ---- STATE MANAGEMENT ----
    const [visitors, setVisitors] = useState([]);
    const [stats, setStats] = useState({ total: 0, preRegistered: 0, invited: 0 });
    const [hosts, setHosts] = useState([]); // List of hosts for the dropdown
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHost, setSelectedHost] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // ---- API CALLS ----
    const fetchVisitors = async () => {
        try {
            // We pass all filters to our new backend route
            const data = await getAllVisitorsAdmin(searchTerm, selectedHost, startDate, endDate);
            
            if (data.success) {
                setVisitors(data.visitors);
                setStats(data.stats);
                
                // Extract unique hosts for the dropdown if we haven't already
                if (hosts.length === 0 && data.visitors.length > 0) {
                    const uniqueHosts = [...new Set(data.visitors
                        .filter(v => v.host && v.host.name)
                        .map(v => v.host.name)
                    )];
                    setHosts(uniqueHosts);
                }
            }
        } catch (error) {
            console.error("Error fetching visitors:", error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchVisitors();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedHost, startDate, endDate]);

    // ---- UI HELPERS ----
    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
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
                    <h1 className="text-2xl font-black text-slate-800">Visitors Directory</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Master view of all Pre-Registered and Invited visitors across the system</p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Visitors</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-purple-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pre-Registered</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.preRegistered}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                        <UserPlus className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Invited</p>
                        <h3 className="text-3xl font-black text-slate-800">{stats.invited}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                        <Send className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search visitor name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                </div>

                <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
                    {/* Host Dropdown */}
                    <div className="relative flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select 
                            value={selectedHost}
                            onChange={(e) => setSelectedHost(e.target.value)}
                            className="w-full sm:w-48 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="All">All Hosts</option>
                            {hosts.map((hostName, index) => (
                                <option key={index} value={hostName}>{hostName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range Picker */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                        <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-400 uppercase mx-1">To</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
                        />
                        {(startDate || endDate) && (
                            <button onClick={clearDateFilter} className="p-1 hover:bg-slate-200 rounded-full transition-colors ml-1">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* VISITORS SCROLLING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                <div className="overflow-auto flex-1 no-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                            <tr className="border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Visitor Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Whom To Visit/Host</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visitors.length > 0 ? visitors.map((v) => (
                                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                {v.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{v.name}</p>
                                                <p className="text-xs font-medium text-slate-500">{v.purpose}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-700">{v.email}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">{v.phone}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-800">{v.host?.name || 'Unassigned'}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <p className="text-sm font-semibold text-slate-700">
                                                {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                }) : '--'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <p className="text-xs font-medium text-slate-700">
                                                {v.createdAt ? new Date(v.createdAt).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                }) : '--'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {v.type === 'pre-register' ? (
                                             <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-200">Pre-Registered</span>
                                        ) : (
                                             <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200">Invited</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">
                                        No visitor records found matching your current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VisitorsManagement;