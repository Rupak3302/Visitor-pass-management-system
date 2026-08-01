const Appointment = require('../models/appointmentModels');
const Pass = require('../models/passModels');
const CheckLog = require('../models/checkLogsModels');
const User = require('../models/userModels');

exports.getMasterReport = async (req, res) => {
    try {
        const { search, hostId, securityId, startDate, endDate, status } = req.query;
        let query = { organizationName: req.user.organizationName };

        // 1. Appt Status Filter
        if (status && status !== 'All' && status !== 'undefined') {
            query.status = status;
        }

        // 2. Date Range Filter
        if (startDate && startDate !== 'undefined' && startDate.trim() !== '') {
            const start = new Date(startDate);
            if (!isNaN(start)) query.visitDate = { ...query.visitDate, $gte: start };
        }
        if (endDate && endDate !== 'undefined' && endDate.trim() !== '') {
            const end = new Date(endDate);
            if (!isNaN(end)) {
                end.setHours(23, 59, 59, 999);
                query.visitDate = { ...query.visitDate, $lte: end };
            }
        }

        // 3. Search Filter
        const visitorPopulate = { path: 'visitorId' };
        if (search && search !== 'undefined' && search.trim() !== '') {
            const safeSearch = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
            visitorPopulate.match = {
                $or: [
                    { name: { $regex: safeSearch, $options: 'i' } },
                    { email: { $regex: safeSearch, $options: 'i' } },
                    { phone: { $regex: safeSearch, $options: 'i' } }
                ]
            };
        }

        // 4. Host Filter
        let hostPopulate = { path: 'hostId', select: 'name phone email role' };
        if (hostId && hostId !== 'All' && hostId !== 'undefined') {
            query.hostId = hostId;
        }

        // 5. FETCH ALL APPOINTMENTS
        let appointments = await Appointment.find(query)
            .populate(visitorPopulate)
            .populate(hostPopulate)
            .sort({ createdAt: -1 });

        appointments = appointments.filter(app => app.visitorId !== null);

        // 6. STITCH EVERYTHING TOGETHER (NOW USING 'scannedBy')
        let masterReportData = await Promise.all(appointments.map(async (app) => {
            const pass = await Pass.findOne({ appointmentId: app._id });
            
            let checkLog = null;
            if (pass) {
                checkLog = await CheckLog.findOne({ passId: pass._id })
                    .populate({ 
                        path: 'scannedBy', // EXACT MATCH TO YOUR SCHEMA
                        select: 'name email' 
                    });
            }

            return {
                appointment: app,
                visitor: app.visitorId,
                host: app.hostId,
                pass: pass || null,
                checkLog: checkLog || null
            };
        }));

        // 7. APPLY NEW SECURITY FILTER
        if (securityId && securityId !== 'All' && securityId !== 'undefined') {
            masterReportData = masterReportData.filter(row => 
                row.checkLog && 
                row.checkLog.scannedBy && 
                row.checkLog.scannedBy._id &&
                row.checkLog.scannedBy._id.toString() === securityId
            );
        }

        // 8. GET UNIQUE HOSTS & SECURITY FOR DROPDOWNS
        const hosts = await User.find({ role: 'host',
            organizationName: req.user.organizationName }).select('name');
        const securityUsers = await User.find({ role: 'security',
            organizationName: req.user.organizationName }).select('name');  

        res.status(200).json({
            success: true,
            hosts: hosts,
            securityUsers: securityUsers,
            reports: masterReportData
        });

    } catch (error) {
        console.error("Master report error:", error);
        res.status(500).json({ success: false, message: "Server error fetching mega report" });
    }
};