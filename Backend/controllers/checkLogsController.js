const CheckLog = require('../models/checkLogsModels');
const Pass = require('../models/passModels');
const Appointment = require('../models/appointmentModels');
const Visitor = require('../models/visitorModels');
const User = require('../models/userModels');
const { now } = require('mongoose');


// Scan Qr code to Check In or Check Out
//  POST /api/checklogs/scan
exports.scanPass = async (req, res) => {
    try {
        const { qrData, passCode } = req.body;
        const securityId = req.user._id;

        // Find the pass ( handle both manual entry and qr scanning entry )
        let pass;
        if (passCode) {
            const cleanPassCode = passCode.trim().toUpperCase();
            pass = await Pass.findOne({ passCode: cleanPassCode })
            .populate('visitorId')
            .populate('appointmentId');
            console.log('Searching database for:', cleanPassCode);

            const allPasses = await Pass.find({});
            console.log("TOTAL PASSES MONGOOSE CAN SEE:", allPasses[0]);

            pass = allPasses.find(p => p.passCode === cleanPassCode)
            console.log('Did JAVASCRIPT find it?:', pass ? 'yes' : 'no');
            // pass = await Pass.findOne({ passCoad: cleanPassCode })
            //     .populate('visitorId')
            //     .populate('appointmentId');

            // console.log('Regex search result:', pass);
            
        } else if (qrData)  {
            pass = await Pass.findById(qrData)
                .populate('visitorId')
                .populate('appointmentId');
        }

        console.log('What mongoose found:', pass);

        if (!pass || !pass.visitorId || !pass.appointmentId) {
            return res.status(404).json({
                message: 'Invalid Pass: Details not found'
            });
        }
        // Check if pass Expiration
        const now = new Date();

        if (now > pass.validUntil && pass.status === 'active') {

            // Kill the pass
            pass.isActive = false;
            pass.status = 'expired';
            await pass.save();

            const appId = pass.appointmentId._id || pass.appointmentId;
            // const Appointment = require('../models/appointmentModels');
            await Appointment.findByIdAndUpdate(appId, { status: 'expired' });

            return res.status(400).json({
                message: `Pass is Expired`
            });
        }

        // check pass is already 
        if (!pass.isActive ||pass.status === 'expired' || pass.status === 'inactive') {
            // const timeStr = pass.updatedAt ? new Date(pass.updatedAt).toLocaleString() : 'Unknown time';
            return res.status(400).json({
                message: `This pass is currently ${pass.status} and cannot be used`
            });
        }

        // Check if the visitor already inside  
        const activeLog = await CheckLog.findOne({
            passId: pass._id,
            status: 'Inside'
        });

        if (!activeLog) {
            // First attempt Check-in
            const newLog = await CheckLog.create({
                passId: pass._id,
                visitorId: pass.visitorId._id,
                appointmentId: pass.appointmentId._id,
                hostId: pass.hostId._id,
                scannedBy: securityId,
                status: 'Inside'

            });

            // Mark pass active
            pass.status = 'active';
            pass.isActive = true;
            await pass.save();

            return res.status(200).json({
                message: 'Check-in successful',
                action: 'checked_in',
                visitorName: pass.visitorId.name,
            });

        } else {
            // Second attempt Check-out
            activeLog.checkOutTime = new Date();
            activeLog.status = 'Inactive'; // log complete
            await activeLog.save();

            // Mark pass inactive/used
            pass.status = 'inactive';
            pass.isActive = false;
            await pass.save();

            const appId = pass.appointmentId._id || pass.appointmentId;
            await Appointment.findByIdAndUpdate(appId, { status: 'completed' });

            return res.status(200).json({
                message: 'Check-out successful',
                action: 'checked_out',
                visitorName: pass.visitorId.name
            });
        }

    } catch (error) {
        console.error('Error scanning pass:', error);
        res.status(500).json({
            message: `Server Error during scan: ${error.message}`
        });
    }
};

// Get last logs
exports.getTodayLogs = async (req, res) => {
    try {
        const now = new Date();
        
        
        // Find 7 day ago for the table
        const startOfSevenDaysAgo = new Date();
        startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 6); // 6 days + today = 7 days
 
        //Get start and end of the day
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        // const endOfDay = new Date();
        // endOfDay.setHours(23, 59, 59, 999);

        // Get today's logs
        // const todayLogs = await CheckLog.find({
        //     createdAt: {
        //         $gte: startOfDay,
        //         $lte: endOfDay
        //     }
        // })
        const recentLogs = await CheckLog.find({
            createdAt: {
                $gte: startOfSevenDaysAgo,
                $lte: now
            }
        })
        .populate('visitorId', 'name phone photo')
        .populate('appointmentId', 'name purpose')
        .populate('hostId', 'name')
        .populate('passId', 'passCode')
        .sort({ createdAt: -1 });

        // Calculate counts
        const totalToday = recentLogs.filter(log => new Date(log.createdAt) >= startOfToday).length;
        const insideCount = recentLogs.filter(log => log.status === 'Inside').length;
        const exitCount = recentLogs.filter(log => log.status === 'Inactive' && new Date(log.createdAt) >= startOfToday).length;

        res.status(200).json({
            logs: recentLogs, 
            counts: { totalToday, insideCount, exitCount }
        });

    } catch (error) {
        console.error('Error getting today logs:', error);
        res.status(500).json({
            message: `Faield to get today's logs: ${error.message}`
        });
    }
};




//         // check pass is already expired
//         if (pass.status !== 'active') {
//             return res.status(400).json({
//                 message: 'Pass Inactive'
//             });
//         }

//         // verify if the pass is expired or deactivated
//         const now = new Date();
//         if (pass.status !== 'active') {
//             return res.status(400).json({
//                 message: `Pass is currently ${pass.status}` 
//             });
//         }
//         if (now > pass.validFrom || now > pass.validUntil) {
             
//             // auto deactivate if pass is expired
//             if (now > pass.validUntil) {
//                 pass.status = 'expired';
//                 await pass.save();
//             }
//             return res.status(400).json({
//                 message: 'Pass has expired'
//             });
//         }

//         // Check if already checked in
//         const activeLog = await checkLog.findOne({
//             passId: pass._id,
//             status: 'checked_in'
//         });

//         // The Check-in and Check-out logic
//         if (activeLog) {

//             // Scenario 1: They are already inside. This is the Check-out
//             activeLog.checkOutTime = now;
//             activeLog.status = 'checked_out';
//             await activeLog.save();


//             // deactivate the pass if they are checked out and pass can't be used anymore
//             pass.status = 'used';
//             await pass.save();

//             return res.status(200).json({
//                 message: 'Check-out successful',
//                 action: 'checked_out',
//                 visitorName: pass.visitorId.name,
//                 time: now
//             });

//         } else {

//             // Scenario 2: They are not inside. This is the Check-in
//             if (!req.user || !req.user.role || req.user.role !== 'security') {

//                 return res.status(403).json({
//                     message: 'Only security can check-in'
//                 });
//             }

//             const newLog = await checkLog.create({
//                 passId: pass._id,
//                 visitorId: pass.visitorId._id,
//                 scannedBy: req.user._id,
//                 checkInTime: now,
//                 status: 'checked_in'
//             });
            
//             return res.status(200).json({
//                 message: 'Check-in successful',
//                 action: 'checked_in',
//                 visitorName: pass.visitorId.name,
//                 time: now
//             });
//         }
        
//     } catch (error) {
//         console.error('Scan pass error:', error.message);
//         res.status(500).json({
//             message: `Server Error during scan : ${error.message}`
//         });
//     }
// };

// // Get all check logs
// // GET /api/checklogs
// // Private (Admin)

// // Fetch all recent scan logs for the security dashboard
// exports.getAllLogs = async (req, res) => {
//   try {
//     // 1. Fetch the 50 most recent scans, bringing in visitor and pass details
//     const logs = await CheckLog.find()
//       .populate('visitorId', 'name phone company')
//       .populate({
//         path: 'passId',
//         select: 'purpose status'
//       })
//       .sort({ updatedAt: -1 }) // Newest first
//       .limit(50);

//     // 2. Count how many people are currently 'checked_in' (inside the building)
//     const currentlyInsideCount = await CheckLog.countDocuments({ status: 'checked_in' });

//     res.status(200).json({
//       currentlyInside: currentlyInsideCount,
//       logs: logs
//     });
//   } catch (error) {
//     console.error('Error fetching security logs:', error);
//     res.status(500).json({ message: 'Failed to fetch logs' });
//   }
// };



// exports.getAllLogs = async (req, res) => {
//     try {
//         const logs = await checkLog.find({})
//             .populate('passId')
//             .populate('scannedBy', 'name email') // show which user(security) scanned the pass
//             .sort({ createdAt: -1 }); // latest logs first
        
//         res.status(200).json(logs);

//     } catch (error) {
//         res.status(500).json({
//             message: `Server Error: ${error.message}`
//         });
//     }
// };