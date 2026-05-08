const Visitor = require('../models/visitorModels');
const Appointment = require('../models/appointmentModels');
const User = require('../models/userModels');
const sendEmail = require('../utils/emailService');




// Register a new visitor
// POST /api/visitors
// Public (visitor can pre-register themselves)
exports.registerVisitor = async (req, res) => {
    try {
        const { name, email, phone, purpose, company, hostId, visitDate, visitTime } = req.body;

        // validate required fields
        if (!name || !email || !phone || !purpose || !hostId || !visitDate || !visitTime) {
            return res.status(400).json({
                message: 'Please fill all the required fields'
            });
        }

        // Check if the host (user) actually exists
        const hostUser = await User.findById(hostId);

        if (!hostUser || !(hostUser.role === 'host' || hostUser.role === 'admin')) {
            return res.status(400).json({
                message: 'Host employee not found'
            });
        } 

        // Get photo filename if uploaded
        const photo = req.file ? req.file.filename : '';
        
        // save the visitor to the database
        const newVisitor = await Visitor.create({
            name,
            email,
            phone,
            company,
            purpose,
            photo,
            hostId,
            visitDate,
            registerBy: res.user?._id || null,
            notes: notes || '',
        });

        // We create an appointment (starts as pending - until host/admin approves it)
        const newAppointment = await Appointment.create({
            visitorId: newVisitor._id, // Link to the visitor
            hostId, // The host they selected
            visitDate: new Date(visitDate), // Convert to Date object
            visitTime,
            status: 'pending', // Starts as pending until Admin/Host approves
            purpose,
            notes: notes || '',
        });

        // Send welcome email to the visitor
        try {
            await sendEmail({
                email: newVisitor.email,
                subject: 'Visitor Registration Successful',
                message: `
                Hello ${newVisitor.name},\n\nYou have successfully registered as a visitor.`,
                html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #2563eb;">Registration Successful!</h2>
                    <p>Hi <b>${newVisitor.name}</b>,</p>
                    <p>Your visitor profile has been successfully created in our system.</p>
                    <p>Company: ${newVisitor.company}</p>
                    <p>${newVisitor.email}</p>
                    <p>${newVisitor.phone}</p>
                </div> `
            });    

        } catch (error) {
            console.log('Email faild but visitor was saved:', error.message);
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

        if (res.user.role === 'host') {
            filter.hostId = res.user._id; // Host can only see their visitors
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

// Get all the hosts ( for dropdown selection when registering a visitor)
// GET /api/hosts
exports.getHosts = async (req, res) => {
    try {
        const hosts = await User.find({
            role: { $in: ['host', 'admin'] }, // Only return users with host or admin role
            isActive: true,
        }, 'name email phone' ) // Only return name, email and phone fields

        res.status(200).json({ hosts });
    } catch (error) {
        console.error('Get hosts error:', error.message);
        res.status(500).json({
            message: `Server error: ${error.message}`
        });
    }
};