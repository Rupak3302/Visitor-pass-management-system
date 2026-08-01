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
            
        } else if (qrData)  {
            const cleanQrData = qrData.trim().toUpperCase();
            pass = await Pass.findOne({ passCode: cleanQrData })
                .populate('visitorId')
                .populate('appointmentId');
        }

        console.log('What mongoose found:', pass);

        if (!pass || !pass.visitorId || !pass.appointmentId) {
            return res.status(404).json({
                message: 'Invalid Pass: Details not found'
            });
        }

        if (pass.status === 'cancelled' || pass.appointmentId.status === 'cancelled') {
            return res.status(400).json({
                message: 'This pass is cancelled'
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
        if (!pass.isActive || pass.status === 'expired' || pass.status === 'cancelled' || pass.status === 'inactive') {
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
                status: 'Inside',
                organizationName: req.user.organizationName

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

// ** ADMIN Management Section **

// Get all check logs with filter 
// GET /admin/checklogs
// Private (Admin)

exports.getAllLogsAdmin = async (req, res) => {
  try {
    const { search, hostId, securityId, startDate, endDate } = req.query;
    let query = { organizationName: req.user.organizationName };

    if (hostId && hostId !== 'All' && hostId !== 'undefined') query.hostId = hostId;
    if (securityId && securityId !== 'All' && securityId !== 'undefined') query.scannedBy = securityId;

    // Date Range filter
    if (startDate && startDate !== 'undefined') {
        query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
    }
    if (endDate && endDate !== 'undefined') {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999) // Set to end of the day
        query.createdAt = { ...query.createdAt, $lte: end };
    }

    // Fatch Alll logs
    let logs = await CheckLog.find(query)
        .populate({
            path: 'passId',
            populate: [
                { path: 'visitorId', select: 'name email phone' },
                { path: 'appointmentId', populate: { path: 'hostId', select: 'name' } },
            ]
        })
        .populate('scannedBy', 'name')
        .sort({ createdAt: -1 });

    // Apply Host Filter ( If spcific host selected )
    // if (hostId && hostId !== 'All' && hostId !== 'undefined') {
    //     logs = logs.filter(log => log.passId.appointmentId.hostId._id.toString() === hostId);
    // }

    // Apply the search  (by visitor name and passcode)
    if (search && search !== 'undefined' && search.trim() !== '') {
        const safeSearch = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // Escape special characters
        logs = logs.filter(log => log.passId.visitorId.name.toLowerCase().includes(safeSearch.toLowerCase()) || log.passId.passCode.toLowerCase().includes(safeSearch.toLowerCase()));
    }

    // Unique Host Filter Dropdown
    // const uniqueHostsMap = new Map();
    // logs.forEach(log => {
    //     const host = log.passId.appointmentId.hostId;
    //     if (host && !uniqueHostsMap.has(host._id.toString())) {
    //         uniqueHostsMap.set(host._id.toString(), { _id: host._id, name: host.name });
    //     }
    // }); 
    // const hosts = Array.from(uniqueHostsMap.values());

    const hosts = await User.find({ role: 'host',
        organizationName: req.user.organizationName }).select('name');
    const securityUsers = await User.find({ role: 'security',
        organizationName: req.user.organizationName }).select('name');

    // Calculate cards counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const stats = {
        total: logs.length,
        today: logs.filter(log => new Date(log.checkInTime) >= todayStart).length,
        inside: logs.filter(log => log.checkOutTime).length,
        exited: logs.filter(log => !log.checkOutTime).length,
    }

    res.status(200).json({
        success: true,
        logs: logs,
        hosts: hosts,
        securityUsers: securityUsers,
        stats: stats
    });

  } catch (error) {
      console.error('Admin fetch check logs error:', error);
      res.status(500).json({
          success: false,
          message: `Failed to fetch check logs: ${error.message}`
      });
  }

};