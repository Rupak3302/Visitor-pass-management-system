import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import { scanVisitorPass } from '../services/checklogApi';

const QRScanner = ({ onScanSuccess }) => {
    const [ manualCode, setManualCode ] = useState('');
    const [ isProcessing, setIsProcessing ] = useState(false);
    const isProcessingRef = useRef(false);

    // Manual Entry handle
    const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualCode.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const data = await scanVisitorPass(null, manualCode);
      toast.success(data.message);
      onScanSuccess(); // Tell parent UI to refresh the table
      setManualCode('');

    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Passcode!");

    } finally {
      setIsProcessing(false);
    }
  };

  // Scan QR handle
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    let isScannerRunning = false;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },

          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            html5QrCode.pause();

            try {
              const data = await scanVisitorPass(decodedText, null);
              toast.success(data.message);
              onScanSuccess(); // Refresh table!

            } catch (error) {
              toast.error(error.response?.data?.message || "Invalid QR Code!");

            } finally {
              setTimeout(() => {
                isProcessingRef.current = false;
                html5QrCode.resume();
              }, 3000);
            }
          },
          () => {} // Ignore continuous errors
        );

        isScannerRunning = true;

      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startScanner();

    return () => {

      if (isScannerRunning) {
        html5QrCode.stop().then(() => html5QrCode.clear());
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Pass Verification</h2>
      
      {/* Camera View */}
      <div id="reader" className="w-full min-h-[250px] bg-slate-50 rounded-lg overflow-hidden border-2 border-blue-500 mb-4"></div>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">Manual Override</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* Manual Input */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Passcode..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          className="flex-1 border border-slate-300 rounded-md p-2 uppercase outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={isProcessing}
          className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 font-medium"
        >
          Verify
        </button>
      </form>
    </div>
  )
};

export default QRScanner;








// import React, { useState, useEffect, useRef } from "react";
// import { Html5Qrcode } from "html5-qrcode";
// import toast from "react-hot-toast";
// import { scanVisitorPass } from "../services/checklogApi";

// const SecurityQRScanner = () => {
//     const [ scanResult, setScanResult] = useState(null);
//     // const [ isProcessing, setIsProcessing ] = useState(false);
//     // const scannerRef = useRef(null);
//     const isProcessingRef = useRef(false);

//     useEffect(() => {

//         // Initialize the scanner
//         const html5QrCode = new Html5Qrcode("reader");
//         let isScannerRunning = false;

//         const startScanner = async () => {
//             try {
//                 await html5QrCode.start(
//                     { facingMode: "environment" },
//                     {
//                         fps: 10,
//                         qrbox: { width: 250, height: 250 },
//                     },
//                     async (decodedText) => {
//                         if (isProcessingRef.current) return;
//                         isProcessingRef.current = true;

//                         html5QrCode.pause();

//                         try {
//                             const data = scanVisitorPass(decodedText);

//                             const { action, visitorName, time } = data;
//                             const timeString = new Date(time).toLocaleTimeString();

//                             // Update the UI based on they are enterning or leaving
//                             if (action === 'check_in') {
//                                 toast.success(`${visitorName} Checked In at ${timeString}`);
//                                 setScanResult({
//                                     type: 'seccess',
//                                     text: `✅ Check-In: ${visitorName}`
//                                 });

//                             } else {
//                                 toast.success(`${visitorName} Checked Out at ${timeString}`);
//                                 setScanResult({
//                                     type: 'seccess',
//                                     text: `✅ Check-Out: ${visitorName}`
//                                 });
//                             }
//                         } catch (error) {
//                             const message = error.response?.data?.message ||  'Invalid or Expired pass!'
//                             toast.error(message);
//                             setScanResult({
//                                 type: 'error',
//                                 text: `❌ ${message}`
//                             });
//                         } finally {
//                             setTimeout(() => {
//                                 setScanResult(null);
//                                 isProcessingRef.current = false;
//                                 html5QrCode.resume();
//                             }, 3000);
//                         }
//                     },
//                     (errorMessage) => { }
//                 );
//                 isScannerRunning = true;
//             } catch (error) {
//                 console.error('Error starting scanner:', error);
//                 setScanResult({ type: 'error', text: '❌ camera access denied. Please check the browser permissions.' });
//             }
//         };
        
//         startScanner();

//         // clean up the scanner when the user leaves the page
//         return () => {
//             if (isScannerRunning) {
//                 html5QrCode.stop().then(() => {
//                     html5QrCode.clear();
//                 }).catch(error => console.error('Failed to stop scanner', error));
//             }
//         };
//     }, []);

//     return (
//         <div className="min-h-screen bg-slate-100 py-10 px-4">
//         <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 text-center">
//             <h1 className="text-2xl font-bold text-slate-800 mb-2">Security Checkpoint</h1>
//             <p className="text-slate-500 mb-6">Point the camera at the visitor's QR code</p>

//             {/* The camera stream will inject itself into this div */}
//             <div id="reader" className="w-full mb-6 rounded-lg overflow-hidden border-2 border-blue-500"></div>

//             {/* Status Display Area */}
//             <div className="h-20 flex items-center justify-center">
//                 {scanResult ? (
//                     <div className={`p-4 rounded-lg font-bold text-lg w-full ${
//                         scanResult.type === 'error' ? 'bg-red-100 text-red-700' :
//                         scanResult.type === 'info' ? 'bg-blue-100 text-blue-700' :
//                         'bg-green-100 text-green-700'
//                         }`}>
//                         {scanResult.text}
//                     </div>
//                 ) : (
//                     <p className="text-slate-400 animate-pulse">Waiting for scan...</p>
//                 )}
//             </div>
//         </div>
//     </div>
//   );
// };

// export default SecurityQRScanner;
