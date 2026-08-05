import React, { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, X, Eye, Download, QrCode, Clock, Ticket } from 'lucide-react';
import { getAllPassesAdmin, downloadPassPdf } from '../../../services/appointmentApi';
import { getVisitorPhotoUrl } from '../../../services/imageService';
import toast from 'react-hot-toast';

const PassesManagement = () => {
    // ---- STATE MANAGEMENT ----
    const [passes, setPasses] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, used: 0, cancelled: 0 });
    const [systemHosts, setSystemHosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedPass, setSelectedPass] = useState(null);
    const [selectedHost, setSelectedHost] = useState('All');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(null);

    // ---- API CALLS ----
    const fetchPasses = async () => {
        setIsLoading(true);
        try {
            const data = await getAllPassesAdmin(searchTerm, selectedHost, startDate, endDate);
            if (data.success) {
                setPasses(data.passes);
                setStats(data.stats);
                if (data.hosts) {
                    setSystemHosts(data.hosts);
                }
            }
        } catch (error) {
            console.error("Error fetching passes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchPasses(), 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedHost, startDate, endDate]);

    // ---- ACTION HANDLERS ----
    const handleViewPass = (pass) => {
        setSelectedPass(pass);
        setIsViewModalOpen(true);
    };

    const handleDownloadPass = async (passId, visitorName) => {
        setIsDownloading(passId);
        try {
            const blob = await downloadPassPdf(passId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${visitorName.replace(/\s+/g, '_')}_SecurePass.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success("Pass downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download pass PDF");
        } finally {
            setIsDownloading(null);
        }
    };

    const clearDateFilter = () => { setStartDate(''); setEndDate(''); };

    // ---- UI HELPERS ----
    const getDisplayStatus = (pass) => {
        const status = pass?.status?.toLowerCase();
        const validUntil = pass?.validUntil ? new Date(pass.validUntil) : null;
        const isExpiredByDate = validUntil && validUntil < new Date();

        if (status === 'expired' || (status === 'active' && isExpiredByDate)) {
            return 'expired';
        }

        if (status === 'inactive' || status === 'used') {
            return 'used';
        }

        if (status === 'cancelled') {
            return 'cancelled';
        }

        return status || 'unknown';
    };

    const getStatusBadge = (pass) => {
        const displayStatus = getDisplayStatus(pass);

        switch (displayStatus) {
            case 'active': return <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Active</span>;
            case 'expired': return <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Expired</span>;
            case 'used': return <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold border border-slate-300">Used</span>;
            case 'cancelled': return <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">Cancelled</span>;
            default: return <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{pass?.status || 'Unknown'}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Passes Management</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Monitor, view, and download all generated security passes</p>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Passes</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active</p>
                    <h3 className="text-2xl font-black text-green-600">{stats.active}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expired</p>
                    <h3 className="text-2xl font-black text-red-600">{stats.expired}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Used / Inactive</p>
                    <h3 className="text-2xl font-black text-slate-600">{stats.used}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cancelled</p>
                    <h3 className="text-2xl font-black text-amber-600">{stats.cancelled}</h3>
                </div>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search visitor name, email, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"/>
                </div>

                {/* host filter dropdown */}
                <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4 items-center">
                    <div className="relative flex items-center gap-2 w-full sm:w-auto">
                        <select value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)} className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option value="All">All Hosts</option>
                            {systemHosts.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full md:w-auto">
                        {/* Date filter */}
                        <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        <span className="text-xs font-bold text-slate-400 uppercase mx-1">To</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer" />
                        {(startDate || endDate) && 
                        <button onClick={clearDateFilter} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4 text-slate-500" />
                        </button>}
                    </div>
                </div>
            </div>

            {/* PASSES SCROLLING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
                <div className="overflow-auto flex-1 no-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                            <tr className="border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Visitor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Issued By</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium animate-pulse">Loading passes...</td></tr>
                            ) : passes.length > 0 ? passes.map((pass) => (
                                <tr key={pass._id} className="hover:bg-slate-50 transition-colors">
                                    
                                    {/* 1. VISITOR DETAILS */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {pass.visitorId?.photoUrl ? (
                                                <img src={getVisitorPhotoUrl(pass.visitorId.photoUrl)} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                                                {pass.visitorId?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{pass.visitorId?.name}</p>
                                                <p className="text-xs font-medium text-slate-500">{pass.visitorId?.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. PASS DETAILS (Passcode & Creation Date) */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Ticket className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-black text-slate-700 tracking-widest">{pass.passCode}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                                            Generated: {new Date(pass.createdAt).toLocaleDateString('en-GB')}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${getDisplayStatus(pass) === 'expired' ? 'text-red-600' : 'text-slate-500'}`}>
                                            <Clock className="w-3 h-3" />
                                            {getDisplayStatus(pass) === 'expired' ? 'Expired' : `Valid until ${new Date(pass.validUntil).toLocaleDateString('en-GB')}`}
                                        </div>
                                    </td>

                                    {/* 3. ISSUED BY (Host) */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-bold text-slate-700">
                                                {pass.hostId?.name || 'Admin / System'}
                                            </p>
                                        </div>
                                    </td>

                                    {/* 4. STATUS */}
                                    <td className="px-6 py-4">
                                        {getStatusBadge(pass)}
                                    </td>

                                    {/* 5. ACTIONS (View & Download) */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleViewPass(pass)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                title="View Pass"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDownloadPass(pass._id, pass.visitorId?.name)}
                                                disabled={isDownloading === pass._id || getDisplayStatus(pass) === 'expired' || getDisplayStatus(pass) === 'cancelled'}
                                                className={`p-2 rounded-lg transition-colors border ${isDownloading === pass._id || getDisplayStatus(pass) === 'expired' || getDisplayStatus(pass) === 'cancelled' ? 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed animate-pulse' : 'text-slate-400 hover:text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'}`}
                                                title={getDisplayStatus(pass) === 'expired' ? 'Expired passes cannot be downloaded' : 'Download PDF'}
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-500 font-medium">No passes found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- VIEW PASS MODAL --- */}
            {isViewModalOpen && selectedPass && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><QrCode className="w-4 h-4 text-blue-600"/> Digital Pass</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-8 flex flex-col items-center">
                            {/* Visual QR Code Placeholder (If you have the actual base64, render it in an <img src={selectedPass.qrCodeImage}>) */}
                            <div className="w-48 h-48 bg-white border-4 border-blue-600 rounded-xl p-2 mb-6 shadow-md flex items-center justify-center">
                                {selectedPass.qrCodeImage ? (
                                     <img src={selectedPass.qrCodeImage} alt="QR" className="w-full h-full object-contain" />
                                ) : (
                                    <QrCode className="w-32 h-32 text-slate-200" />
                                )}
                            </div>

                            <h3 className="text-xl font-black text-slate-800">{selectedPass.visitorId?.name}</h3>
                            <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mt-1 mb-4">{selectedPass.passCode}</p>
                            
                            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Host</span>
                                    <span className="text-sm font-bold text-slate-700">{selectedPass.appointmentId?.hostId?.name || 'System'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Valid Until</span>
                                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-500" />
                                        {new Date(selectedPass.validUntil).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                            {getStatusBadge(selectedPass)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassesManagement;