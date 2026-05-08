const checkLog = require('../models/checkLogsModels');
const Pass = require('../models/passModels');

// Scan Qr code to Check In or Check Out
//  POST /api/checklogs/scan
// Private (Security, Admin)
exports.scanPass = async (req, res) => {
    try {
        const { passId } = req.body;

        // Verify the pass exists 
        const pass = await Pass.findOne({
            passId: passId, // find pass by appointmentId
            status: 'active', 
        }).populate({
            path: 'appointmentId',
            populate: {
                path: 'visitorId'
            }
        });

        if (!pass) {
            return res.status(404).json({
                message: 'Valid Pass not found'
            });
        }

        // Pass is active or not
        if (pass.status !== 'active') {
            return res.status(400).json({
                message: 'Pass Inactive'
            });
        }

        // verify the pass is not expired
        if (new Date() > new Date(pass.validUntil)) {
            return res.status(400).json({
                message: 'Pass has expired'
            });
        }

        // Check if already checked in
        const activeLog = await checkLog.findOne({
            passId: pass._id,
            checkOutTime: null
        });

        if (!activeLog) {
            // Check In
            const newLog = await checkLog.create({
                passId: pass._id,
                scannedBy: req.user._id
            });
            return res.status(200).json({
                message: 'Check-in successful',
                log: newLog
            });

        } else {
            // Check Out
            activeLog.checkOutTime = new Date();
            await activeLog.save();
            
            return res.status(200).json({
                message: 'Check-out successful',
                log: activeLog 
            });
        }
        
    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};

// Get all check logs
// GET /api/checklogs
// Private (Admin)
exports.getAllLogs = async (req, res) => {
    try {
        const logs = await checkLog.find({})
            .populate('passId')
            .populate('scannedBy', 'name email') // show which user(security) scanned the pass
            .sort({ createdAt: -1 }); // latest logs first
        
        res.status(200).json(logs);

    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};