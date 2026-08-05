import React, { useState, useEffect } from 'react';
import { User, Phone, Ticket, Users, LogIn, LogOut} from 'lucide-react';
import QRScanner from '../../components/QRScanner';
import { getTodayLogs } from '../../services/checklogApi';
import toast from 'react-hot-toast';

const SecurityPanel = () => {
  const [logs, setLogs] = useState([]);
  const [counts, setCounts] = useState({ totalToday: 0, insideCount: 0, exitCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from backend
  const fetchDashboardData = async () => {
    try {
      const data = await getTodayLogs();
      setLogs(data.logs);
      setCounts(data.counts);
    } catch (error) {
      toast.error("Failed to load security logs.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run on first load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Security Command Center</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Scanner */}
          <div className="lg:col-span-1">
             {/* Pass fetchDashboardData so it auto-updates the table when someone is scanned! */}
            <QRScanner onScanSuccess={fetchDashboardData} />
          </div>

          {/* RIGHT COLUMN: Dashboard & Table */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 3 Count Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 text-center border-l-4 border-l-slate-800">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Today</p>
                <p className="text-2xl font-black text-slate-800 mt-2"><Users className="inline w-6 h-8 mr-3 align-middle " />{counts.totalToday}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-blue-100 text-center border-l-4 border-l-green-500">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Inside</p>
                <p className="text-2xl font-black text-green-600 mt-2"><LogIn className="inline w-6 h-8 mr-3 align-middle" />{counts.insideCount}</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-slate-200 text-center border-l-4 border-l-blue-500">
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Exited</p>
                <p className="text-2xl font-black text-blue-600 mt-2"><LogOut className="inline w-6 h-8 mr-3 align-middle" />{counts.exitCount}</p>
              </div>
            </div>

            {/* Today's Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Live Activity Feed ( last 7 days )</h3>
                <button onClick={fetchDashboardData} className="text-sm text-blue-600 hover:text-blue-800">Refresh</button>
              </div>
              
              <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] relative bg-white rounded-b-xl scrollbar-hover-only">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-bold border-b border-slate-200 tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 font-medium">Visitor Details</th>
                      <th className="px-6 py-4 font-medium">Host & Purpose</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Check-In / Check Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Loading logs...</td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No activity today.</td></tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Use the visitor's photo if available, otherwise show the user icon */}
                              {log.visitorId?.photoUrl ? (
                                <img src={getVisitorPhotoUrl(log.visitorId.photoUrl)}  alt="visitor" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                              <div>
                                <p className="text-xs font-semibold text-slate-800">{log.visitorId?.name || 'Unknown Visitor'}</p>
                                <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><Phone className="w-3 h-3"/>{log.visitorId?.phone}</p>
                                <p className="flex items-center gap-1 text-xs font-medium text-blue-600 mt-0.5 tracking-wider"><Ticket className="w-3 h-3"/>{log.passId?.passCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-700">{log.hostId?.name}</p>
                            <p className="text-xs text-slate-500">{log.appointmentId.purpose}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              log.status === 'Inside' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-green-600 font-medium whitespace-nowrap">
                              {/* Check-In: {new Date(log.checkInTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true})} */}
                              Check-In: {new Date(log.checkInTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},{' '} 
                              {new Date(log.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </p>
                            <p className="text-[13px] text-blue-600 font-semibold whitespace-nowrap mt-1">
                              {/* Check-Out: {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', second:'2-digit', hour12: true}) : '--:--'} */}
                              Check-Out: {log.checkOutTime 
                              ? `${new Date(log.checkOutTime).toLocaleDateString('en-US', {   month: 'short', day: 'numeric' })}, 
                                ${new Date(log.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` 
                              : '--:--'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;