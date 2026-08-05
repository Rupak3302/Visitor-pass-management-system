const Visitor = require('../models/visitorModels');
const Appointment = require('../models/appointmentModels');
const User = require('../models/userModels');
const sendEmail = require('../utils/emailService');


// Register a new visitor
// POST /api/visitors
// Public (visitor can pre-register themselves)
exports.registerVisitor = async (req, res) => {
    try {
        const { name, email, phone, purpose, company, hostId, visitDate, visitTime, notes } = req.body;

        // validate required fields
        if (!name || !email || !phone || !purpose || !hostId || !visitDate || !visitTime) {
            return res.status(400).json({
                message: 'Please fill all the required fields'
            });
        }

        // verify that the host employee exists and has the correct role (host or admin)
        const hostUser = await User.findById(hostId);

        if (!hostUser || !(hostUser.role === 'host' || hostUser.role === 'admin')) {
            return res.status(400).json({
                message: 'Host employee not found'
            });
        } 

        // Get photo filename if uploaded ( set by multer middleware )
        const photo = req.file ? req.file.filename : '';
        
        // save the visitor to the database
        const newVisitor = await Visitor.create({
            organizationName: hostUser.organizationName,
            name,
            email,
            phone,
            company,
            purpose,
            photoUrl: photo,
            hostId,
            visitDate,
            visitTime,
            registerBy: req.user?._id || null,
            notes: notes || '',
        });

        // We create an appointment (starts as pending - until host/admin approves it)
        const newAppointment = await Appointment.create({
            organizationName: hostUser.organizationName,
            visitorId: newVisitor._id, // Link to the visitor
            hostId: hostId, // The host they selected
            visitDate: new Date(visitDate),
            visitTime: visitTime,
            status: 'pending', // Starts as pending until Admin/Host approves
            purpose: purpose,
            notes: notes || '',
        });

        // Send welcome email to the visitor
        try {
            await sendEmail({
                email: newVisitor.email,
                subject: 'Visitor Registration Successful',
                message: `
                Hello ${newVisitor.name},\n\nYou have completed your registration.`,
                html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Registration Successful!</h2>
                    <p>Hi <b>${newVisitor.name}</b>,</p>
                    <p>Your personal details</p>
                    <p>${newVisitor.email}</p>
                    <p>${newVisitor.phone}</p>
                    <p>And Your appointment is pending to approval. Please wait for the approval email.</p>

                </div> `
            });    

        } catch (emailError) {
            console.log('Email failed but visitor was saved:', emailError.message);
        }

        // Return BOTH the visitor and the appointment data
        res.status(201).json({
            message: 'Registration submitted successfully! Waiting for the approval.',
            visitor: newVisitor,
            appointment: newAppointment,
        });

    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};

// Get all the registered visitors
// GET /api/visitors
// Private (Host can view only their visitors)
exports.getAllVisitors = async (req, res) => {
    try {
        let filter = {};

        if (req.user?.role === 'host') {
            filter.hostId = req.user._id; // Host can only see their visitors
        }

        const Visitors = await Visitor.find(filter)
        .populate('hostId', 'name email')
        .populate('registerBy', 'name')
        .sort({ createdAt: -1 }); // Sort by most recent

        res.status(200).json({
            count: Visitors.length,
            visitors: Visitors,
        });

    } catch (error) {
        console.error('Get visitors error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};

// Get a single visitor by ID
// GET /api/visitors/:id
exports.getVisitorById = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id)
        .populate('hostId', 'name email phone');

        if (!visitor) {
            return res.status(404).json({
                message: 'Visitor not found'
            });
        }

        res.status(200).json({ visitor });

    } catch (error) {
        console.error('Get visitor error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};

// NEW: Get all unique organizations for the registration dropdown
// GET /api/visitors/organizations
exports.getOrganizations = async (req, res) => {
    try {
        // .distinct() finds all unique values for a specific field!
        const orgs = await User.distinct('organizationName', { isActive: true });
        res.status(200).json({ organizations: orgs });
    } catch (error) {
        console.error('Get organizations error:', error.message);
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
};

// Get all the hosts ( filter by organization for dropdown selection when registering a visitor)
// GET /api/hosts
exports.getHosts = async (req, res) => {
    try {
        const { organizationName } = req.query;
        let filter = {
            role: 'host', // Only fetch users with the role of host!
            isActive: true,
        };

        // If an organizations is passed, only 
        if (organizationName && organizationName !== 'undefined') {
            filter.organizationName = organizationName;
        }

        const hosts = await User.find(filter, 'name email phone'); // Only return name, email and phone fields
        res.status(200).json({ hosts });
    } catch (error) {
        console.error('Get hosts error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};

// ** Admin Visitors Management **

// GET /api/visitors/admin/all
exports.getAllVisitorsAdmin = async (req, res) => {
    try {
        const { search, host, startDate, endDate } = req.query;
        let query = { organizationName: req.user.organizationName };

        // Apply the date range filter (if both start and end dates are provided)
        if (startDate && startDate !== 'undefined') {
            query.visitDate = { ...query.visitDate, $gte: new Date(startDate) };
        } 
        if (endDate && endDate !== 'undefined') {
            // Set end date to the end of the day (11:59:59 PM)
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.visitDate = { ...query.visitDate, $lte: end };
        }

        // Apply the search filter
        const visitorPopulate = { path: 'visitorId', select: 'name email phone photoUrl purpose' };
        if (search && search.trim() !== 'undefined' && search.trim() !== '') {
            // Escape regex characters so things like "+91" don't crash db
            const safeSearch = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            visitorPopulate.match = {
                $or: [
                    { name: { $regex: safeSearch, $options: 'i' } },
                    { email: { $regex: safeSearch, $options: 'i' } },
                    { phone: { $regex: safeSearch, $options: 'i' } }
                ]
            };
        } 

        // Apply the host dropdown filter
        const hostPopulate = { path: 'hostId', select: 'name email' };
        if (host && host !== 'All' && host !== 'undefined') {
            hostPopulate.match = { name: host };
        }

        // Fetch All appointments that match the date range filter 
        let appointments = await Appointment.find(query)
            .populate(visitorPopulate)
            .populate(hostPopulate)
            .sort({ createdAt: -1 }); // Sort by visit date

        // Backup in case database returns null
        if (!appointments) appointments = [];

        // 
        appointments = appointments.filter(app => app.visitorId !== null && app.hostId !== null); 

        // Convert the appointments to visitors
        const formattedVisitors = appointments.map(app => {
            const visitor = app.visitorId;
            const hostUser = app.hostId;

            // If the visitor data is missing, then pre-registered. Otherwise, it's invited
            const visitorType = (!visitor.registerBy || visitor.registerBy === null) ? 'pre-register' : 'invited';

            return {
                _id : app._id,
                name: visitor.name || 'Unknown',
                email: visitor.email || 'No email',
                phone: visitor.phone || 'No phone',
                purpose: visitor.purpose || 'Other',
                host: {
                    name: hostUser.name || 'Unassigned',
                },
                photoUrl: visitor.photoUrl,
                visitDate: app.visitDate,
                visitTime: app.visitTime,
                status: app.status,
                type: visitorType,
                createdAt: app.createdAt
            };
        });

        // Calculate the ststs cards
        const ststs = {
            total: formattedVisitors.length,
            preRegistered: formattedVisitors.filter(v => v.type === 'pre-register').length,
            invited: formattedVisitors.filter(v => v.type === 'invited').length,
        }

        res.status(200).json({
            success: true,
            stats: ststs,
            visitors: formattedVisitors
        });

    } catch (error) {
        console.error('Admin fetch all visitors error:', error.message);
        res.status(500).json({
            success: false,
            message: `Server error fetching visitors for admin: ${error.message}`
        });
    }
};