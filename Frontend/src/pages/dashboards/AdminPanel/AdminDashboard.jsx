import React, { useState, useEffect } from 'react';
import { Users, Calendar, Ticket, LogIn, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getDashboardStatsAdmin } from '../../../services/dashboardApi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await getDashboardStatsAdmin();
                if (res.success) {
                    setData(res);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load dashboard analytics");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold animate-pulse">Loading System Analytics...</p>
            </div>
        );
    }

    if (!data) return null;

    const { stats, charts, recentActivity } = data;

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
        <div className="flex flex-col gap-6 pb-8">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-black text-slate-800">System Overview</h1>
                <p className="text-sm font-medium text-slate-500 mt-1">Real-time analytics and security pulse</p>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Visitors</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.totalVisitors}</h3>
                    </div>
                    <Users className="w-8 h-8 text-blue-100" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Appointments</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.totalAppointments}</h3>
                    </div>
                    <Calendar className="w-8 h-8 text-indigo-100" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-violet-500 flex justify-between items-center">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Passes Issued</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.totalPasses}</h3>
                    </div>
                    <Ticket className="w-8 h-8 text-violet-100" />
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500 flex justify-between items-center bg-emerald-50/30">
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Currently Inside</p>
                        <h3 className="text-2xl font-black text-emerald-700">{stats.currentlyInside}</h3>
                    </div>
                    <LogIn className="w-8 h-8 text-emerald-200" />
                </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* AREA CHART - TRAFFIC */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <h2 className="text-base font-bold text-slate-800">Visitor Traffic (Last 7 Days)</h2>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DONUT CHART - PASS STATUS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 mb-2">Pass Status Distribution</h2>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={charts.passChartData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {charts.passChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }}/>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-2">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-800">Recent Appointments</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Visitor</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Host</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date & Time</th>
                                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {recentActivity.length > 0 ? recentActivity.map((apt) => (
                                <tr key={apt._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-bold text-slate-700">{apt.visitorId?.name || 'Unknown'}</td>
                                    <td className="px-6 py-3 font-bold text-slate-700">{apt.hostId?.name || 'Unknown'}</td>
                                    <td className="px-6 py-3 text-slate-500">
                                        {new Date(apt.visitDate).toLocaleDateString('en-GB')} at {formatTime(apt.visitTime)}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${apt.status === 'approved' ? 'bg-green-100 text-green-700' : apt.status === 'rejected' ? 'bg-red-100 text-red-700' : apt.status === 'cancelled' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No recent activity.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;