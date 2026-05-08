import { useState, useEffect } from "react";
import { ScanLine, CheckCircle, Clock, LogIn, LogOut, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const SecurityPanel = () => {

    const SecurityPanel = () => {
        const [activePasses, setActivePasses] = useState([]);
        const [scanInput, setScanInput] = useState("");
        const [loading, setLoading] = useState(true);

        // This state holds the data for the "Live Scan Monitor" section
        const [gateStatus, setGateStatus] = useState({
            passId: "",
            checkInTime: "--:--",
            checkOutTime: "--:--",
            action: "Awaiting Scan...",
            statusColor: "text-slate-400"
        });

        const fetchActivePasses = async () => {
            try {
                const res = await api.get('/appointments'); 
                const approvedOnly = res.data.filter(app => app.status === 'approved');
                setActivePasses(approvedOnly);
            } catch (error)  {
                toast.error("Failed to load active passes");
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchActivePasses();
        }, []);

        const handleScanSubmit = async (e) => {
            e.preventDefault(); 

            if (!scanInput.trim()) return;

            const currentScanId = scanInput.trim();

            try {
                // Send the ID to your backend
                const res = await api.post('/checklogs/scan', { passId: currentScanId });
                
                // Format the exact time it happened
                const timestamp = new Date(res.data.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                if (res.data.type === 'checkin') {
                    // FIRST SCAN: Show Pass ID, show Check In Time, change button to Check Out
                        setPanelData({
                        passId: currentScanId,
                        checkedInTime: timestamp,
                        checkOutTime: "--:--",
                        buttonText: "Ready to Check Out", // Button changes!
                        buttonColor: "bg-blue-600"
                    });

                    toast.success("Successfully Checked In!");
                } else {
                    // SECOND SCAN: Keep Pass ID, keep Check In Time, show Check Out Time
                    setPanelData({
                        passId: currentScanId,
                        checkedInTime: panelData.checkedInTime !== "--:--" ? panelData.checkedInTime : "Earlier", 
                        checkOutTime: timestamp,
                        buttonText: "Checked Out Complete", // Button changes again!
                        buttonColor: "bg-slate-600"
                    });
                    toast.success("Successfully Checked Out!");
                    fetchActivePasses(); // Remove them from the expected list
                }
            
            } catch (error) {
            // INVALID SCAN: Make Pass ID blank and reset panel as requested
            setPanelData({
                passId: "",
                checkedInTime: "--:--",
                checkOutTime: "--:--",
                buttonText: "Invalid Pass",
                buttonColor: "bg-red-600"
            });
            toast.error(error.response?.data?.message || "Invalid Scan", { icon: '❌' });
            } finally {
            setScanInput(""); // Clear the input box for the next scan
            }
        };

        if (loading) return <div className="p-4 text-center">Loading security protocols...</div>;

        return (

            <div className="space-y-6">
            
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT SIDE: VISIBLE SCANNER INPUT */}
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-lg text-center flex flex-col justify-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4 mx-auto">
                            <ScanLine className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">QR Scanner</h2>
                        <p className="text-slate-400 mb-6 text-sm">Use hardware scanner or type Pass ID manually.</p>
                    
                        <form onSubmit={handleScanSubmit} className="max-w-md mx-auto w-full flex gap-2">

                            <input
                                type="text"
                                autoFocus
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                placeholder="Enter Pass ID here..."
                                className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition"
                                >
                                Scan
                            </button>

                        </form>
                    </div>

                    {/* RIGHT SIDE: THE DISPLAY PANEL YOU REQUESTED */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2 border-slate-100">Verification Panel</h2>
                    
                        <div className="space-y-4">
                            {/* Pass ID Section */}
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Pass ID:</span>
                                <span className="font-mono font-bold text-slate-800">
                                    {panelData.passId || "--- (Blank) ---"}
                                </span>
                            </div>

                            {/* CheckedInTime Section */}
                            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                                <span className="text-green-700 font-medium text-sm">Checked In Time:</span>
                                <span className="font-bold text-green-800">{panelData.checkedInTime}</span>
                            </div>

                            {/* CheckOutTime Section */}
                            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="text-blue-700 font-medium text-sm">Check Out Time:</span>
                                <span className="font-bold text-blue-800">{panelData.checkOutTime}</span>
                            </div>

                            {/* The Dynamic Check Button */}
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    className={`w-full py-3 rounded-lg text-white font-bold tracking-wide transition ${panelData.buttonColor}`}
                                    disabled
                                >
                                    {panelData.buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* THE EXPECTED VISITORS TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Expected Visitors (Approved Only)</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500 bg-slate-50">
                                <th className="p-4">Visitor</th>
                                <th className="p-4">Host</th>
                                <th className="p-4">Time Expected</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activePasses.map((app) => (
                                <tr key={app._id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-900">{app.visitorId?.name}</td>
                                    <td className="p-4 text-slate-600">{app.hostName}</td>
                                    <td className="p-4 text-slate-600">{app.time}</td>
                                    <td className="p-4">
                                        <span className="flex items-center w-fit gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                                {activePasses.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500">No expected visitors at this time.</td>
                            </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        );
    };
};

//     return (
//         <div className="space-y-6">

//             {/* Quick Scan Section */}
//             <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
//                 <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">

//                     <ScanLine className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <h2 className="text-xl font-bold text-slate-800 mb-2">Scan Visitor Pass</h2>
//                 <p className="text-slate-600 mb-6">Use the hand-scanner or manually enter the Pass ID below.</p>
                
//                 <div className="flex justify-center max-w-md mx-auto relative">

//                     <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
//                     <input 
//                         type="text" 
//                         placeholder="e.g. PASS-1234" 
//                         className="w-full py-3 pl-12 pr-4 font-mono text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
//                     />
//                     <button className="absolute right-2 top-2 px-4 py-1.5 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
//                         Verify
//                     </button>
//                 </div>
            
//             </div>

//             {/* Today's Expected Visitors Table */}
//             <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
//                 <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
//                     <h3 className="font-bold text-slate-800">Today's Active Passes</h3>
//                     <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">3 Total</span>
//                 </div>
                
//                 <table className="w-full text-left border-collapse">
//                     <thead>
//                         <tr className="border-b border-slate-200 text-sm font-medium text-slate-500">
//                         <th className="p-4">Pass ID</th>
//                         <th className="p-4">Visitor Name</th>
//                         <th className="p-4">Host</th>
//                         <th className="p-4">Status</th>
//                         <th className="p-4 text-right">Gate Action</th>
//                         </tr>
//                     </thead>

//                     <tbody className="divide-y divide-slate-100">

//                         {todaysVisitors.map((visitor) => (
//                             <tr key={visitor.id} className="hover:bg-slate-50 transition">
//                                 <td className="p-4 font-mono text-sm text-slate-500">{visitor.passId}</td>
//                                 <td className="p-4 font-medium text-slate-800">{visitor.name}</td>
//                                 <td className="p-4 text-slate-600">{visitor.host}</td>
//                                 <td className="p-4">
//                                     <span className={`px-3 py-1 text-xs font-semibold rounded-full 
//                                         ${visitor.status === 'Approved' ? 'bg-yellow-100 text-yellow-700' : ''}
//                                         ${visitor.status === 'Checked In' ? 'bg-green-100 text-green-700' : ''}
//                                         ${visitor.status === 'Checked Out' ? 'bg-slate-100 text-slate-600' : ''}
//                                     `}>
//                                         {visitor.status}
//                                     </span>
//                                 </td>

//                                 {/* Show Check In if Approved, Show Check Out if already inside */}
//                                 <td className="p-4 text-right">

//                                     {visitor.status === 'Approved' && (
//                                         <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition">
//                                             <UserCheck className="w-4 h-4" /> Check In
//                                         </button>
//                                     )}

//                                     {visitor.status === 'Checked In' && (
//                                         <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition">
//                                             <LogOut className="w-4 h-4" /> Check Out
//                                         </button>
//                                     )}

//                                     {visitor.status === 'Checked Out' && (
//                                         <span className="text-sm text-slate-400">Departed</span>
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

export default SecurityPanel;