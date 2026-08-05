const Appointment = require('../models/appointmentModels'); // the appointment model
const Visitor = require('../models/visitorModels'); // the visitor model
const Pass = require('../models/passModels'); // the pass model
const User = require('../models/userModels'); // the user model
const { generateQRCode, generatePDFBadge } = require('../controllers/passController');
const sendEmail = require('../utils/emailService'); // the email service
// const sendSMS = require('../utils/smsService'); // the sms service
const crypto = require('crypto'); // for generating random numbers
const { constants } = require('fs/promises');


// Get all appointments (with Search, Filter & Role check)
// GET /api/appointments
// Private (Admin see all appointments, Host see only their own appointments)
exports.getAppointments = async (req, res) => {
    try {
        let filter = {};

        // Hosts can only see their own appointments; admins can see everything
        if (req.user.role?.toLowerCase() === 'host') {
            filter.hostId = req.user._id;
        }

        // Filter by status if provided in query (e.g., ?status=approved)
        if (req.query.status) {
            filter.status = req.query.status; 
        }

        // Add the date range filter for show the appointments within the date range
        const { startDate , endDate } = req.query;

        if (startDate || endDate) {
            filter.visitDate = {};

            if (startDate && startDate.trim() !== "") {
                // Match appointments on or after the start date
                const start = new Date(startDate);
                if (!isNaN(start.getTime())) {  // check if the date is valid
                    filter.visitDate.$gte = start;
                }

            }
            if (endDate && endDate.trim() !== "") {
                // normalize the end date time stamp to midnight of the day
                const end = new Date(endDate);
                if (!isNaN(end.getTime())) {  
                    end.setHours(23, 59, 59, 999); // set to the end of the day
                    filter.visitDate.$lte = end;
                }
            }
        }

        // If the filter object is empty, remove the visitDate key
        if (filter.visitDate && Object.keys(filter.visitDate).length === 0) {
            delete filter.visitDate;
        }

        // Search by visitor name or email or phone
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i'); // 'i' case-insensitive

            // Find matching visitors based on the search query
            const matchingVisitors = await Visitor.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            }).select('_id'); // only grab the visitor IDs
            
            // Extract the visitor IDs from the matching visitors
            const visitorIds = matchingVisitors.map(v => v._id);
            filter.visitorId = { $in: visitorIds };
        }

        // If they Admin or Security, the query stay empty, means find all appointments 
        const appointments = await Appointment.find(filter)
            .populate('visitorId', 'name email phone photoUrl purpose company')
            .populate('hostId', 'name email') 
            .populate('actionBy', 'name') 
            .sort({ createdAt: -1}); // upcoming dates first 

        res.status(200).json({
            count: appointments.length,
            appointments
        });

    } catch (error) {
        console.error("Fetch appointments error:", error.message);
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};


// Get a single appointment by ID
// GET /api/appointments/:id
exports.getAppointmentById = async (req, res) => {
    try {

        const appointment = await Appointment.findById(req.params.id)
        .populate('visitorId', 'name email phone company photo')
        .populate('hostId', 'name email phone role');

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        res.status(200).json({ appointment });

    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};

// Update appointment status and send email
// PUT /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res) => {

    // Get the status, rejection reason, visit date and time
    const { status, rejectionReason, visitDate, visitTime } = req.body;
    const appointmentId = req.params.id;

    try {
        // Find the appointment and populate visitor details for email
        const appointment = await Appointment.findById(appointmentId).populate('visitorId')

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        // (Admin can update any appointments, but Host can only update their own appointments)
        if (appointment.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Not authorized to update this appointment'
            });
        }

        // Re-schedule the visit date and time if host not available on that day/time
        if (visitDate) appointment.visitDate = visitDate;
        if (visitTime) appointment.visitTime = visitTime;

        // Update the appointment status and save in DB
        appointment.status = status;
        appointment.actionBy = req.user._id; // track who approved/rejected 
        appointment.actionAt = new Date(); // track when the status was updated

        await appointment.save();

        // If the status is rejected, save the rejection reason
        if ((status === 'rejected' || status === 'cancelled') && rejectionReason) {
            appointment.rejectionReason = rejectionReason;
        }

        await appointment.save(); 

        // Populate the visitor and host details before returning it to the frontend
        await appointment.populate('visitorId', 'name email phone company photoUrl');
        await appointment.populate('hostId', 'name email');

        // Prepare the email notification to the visitor based on the new status
        let emailSubject = '';
        let emailMessage = '';
        let emailAttachments = [];


        if (status === 'approved') {
            // Create the unique 6-digit text code
            const passCode = crypto.randomBytes(3).toString('hex').toUpperCase();

            // Difine validity of the pass after approved to end of the day
            const validFrom = new Date();
            const validUntil = new Date(validFrom);
            validUntil.setHours(23, 59, 59, 999); // Set time to 11:59:59 PM of the approval day

            // Generate the QR code
            const qrCodeImage = await generateQRCode(passCode);

            // Generate the PDF badge
            const pdfPath = await generatePDFBadge(appointment.visitorId, appointment, qrCodeImage, passCode);

            console.log('Tracker: Attempting to save pass to DB');
            // save the pass to the DB
            const newPass = await Pass.create({
                appointmentId: appointment._id,
                visitorId: appointment.visitorId._id,
                hostId: appointment.hostId._id,
                organizationName: appointment.organizationName,
                qrCodeData: qrCodeImage,
                passCode: passCode,
                validFrom: validFrom,
                validUntil: validUntil,
                isActive: true,
                status: 'active',                
            });
            console.log('Tracker: Pass saved to DB');
            

            // Prepare the Email Payload
            emailSubject = 'Your Appointment is Approved - SecurePass';
            emailMessage = `
                Hello ${appointment.visitorId.name},<br><br>
                Your visit scheduled for ${new Date(appointment.visitDate).toLocaleDateString()} at ${appointment.visitTime} has been Approved by ${req.user.name}.<br><br>
                And your pass is also generated.<br><br>
                Your pass is attached below in a PDF format </b><br>
                You must save this pass because it is required to verify your identity during checkin and checkout.<br><br>
                And your Pass Code: <b>${passCode}</b> 
                `;
            emailAttachments = [{
                filename: 'visitor-pass.pdf',
                path: pdfPath
            }];
        
        } else if (status === 'rejected') {
            emailSubject = 'Your Appointment is Rejected - SecurePass';
            let reasonText = rejectionReason ? `Reason: ${rejectionReason}` : '';
            emailMessage = `
                Hello, ${appointment.visitorId.name},
                
                Unfortunately, your visit scheduled for ${new Date(appointment.visitDate).toLocaleDateString()} at ${appointment.visitTime} has been declined. 
                
                Reason: ${rejectionReason}.
                
                Please contact ${req.user.name} for any further information.
                `;
        } else if (status === 'cancelled') {

            await Pass.findOneAndUpdate(
                {appointmentId: appointment._id},
                {status: 'cancelled', isActive: false},
            );

            emailSubject = 'Your Appointment is Cancelled - SecurePass';
            emailMessage = `
                Hello, <b>${appointment.visitorId.name}</b>,<br><br>
                Please note that your visit scheduled with <b>${req.user.name}</b> on <b>${new Date(appointment.visitDate).toLocaleDateString()}</b> at <b>${appointment.visitTime}</b> has been <b>cancelled</b>.<br><br>
                ${rejectionReason ? `<b>Reason for cancellation:</b> ${rejectionReason}<br><br>` : ''}
                The security pass issued for this appointment is now deactivated and will no longer allow you to access the pass for entry.<br><br>
                Thank you,<br>
                ${req.user.name}
            `;
        }

        // Send the email notification to the visitor
        try {
            await sendEmail({
                email: appointment.visitorId.email,
                subject: emailSubject,
                html: emailMessage, // using html version
                attachments: emailAttachments // Passing the PDF attachment
            });

        } catch (emailError) {
            console.error('Status updated, But Email failed to send:', emailError.message);
        }

        res.status(200).json({
            message: `Appointment status updated to ${status} successfully`,
            appointment
        });

    } catch (error) {
        console.error("Update status error:", error.message);
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};

// Host can invite visitors directly, Admin can invite on behalf of the host
// POST /api/appointments/invite
// Private (Admin and Host)
exports.inviteVisitor = async (req, res) => {
    try {
        const { name, email, phone, company, purpose, visitDate, visitTime, hostId } = req.body;

        // Default to the logged-in host
        let targetHostId = req.user._id;

        // If an admin is making the request, they can assign it to another host
        if (req.user.role === 'admin') {
            targetHostId = hostId;
        };

        // create the visitor in the DB
        const newVisitor = await Visitor.create({
            organizationName: req.user.organizationName,
            name,
            email,
            phone,
            company,
            purpose,
            hostId: targetHostId,
            registerBy: req.user._id
        });

        // create the appointment in the DB (Automatically set to 'approved')
        const appointment = await Appointment.create({
            organizationName: req.user.organizationName,
            visitorId: newVisitor._id,
            hostId: targetHostId,
            visitDate,
            visitTime,
            purpose,
            status: 'approved', // default state
            actionBy: req.user._id,
            actionAt: new Date()
        });

        // Generate a random 6-digit pass code
        const passCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const validFrom = new Date(visitDate);
        const validUntil = new Date(validFrom);
        validUntil.setHours(23, 59, 59, 999); // Set time to 11:59:59 PM to end

        const qrCodeImage = await generateQRCode(passCode);

        // Populate details for the PDF and Email
        await appointment.populate('visitorId', 'name email phone company photoUrl');
        await appointment.populate('hostId', 'name email phone');

        // Generate the PDF badge
        const pdfPath = await generatePDFBadge(appointment.visitorId, appointment, qrCodeImage, passCode);

        const newPass = await Pass.create({
            organizationName: req.user.organizationName,
            appointmentId: appointment._id,
            visitorId: appointment.visitorId._id,
            hostId: appointment.hostId._id,
            qrCodeData: qrCodeImage,
            passCode: passCode,
            validFrom,
            validUntil,
            status: 'active',
            isActive: true
        });

        // Send Invitation email to the visitor
        const emailSubject = 'Invitation: Your Visit is Scheduled - SecurePass';
        const emailMessage = `
            Hello, <b>${appointment.visitorId.name}</b>
            Your have been invited for a visit by <b>${appointment.hostId.name}</b>.<br><br>
            Your visit is scheduled for <b>${new Date(appointment.visitDate).toLocaleDateString()}</b> at <b>${appointment.visitTime}</b>.<br><br>
            Your Pass is attached below in a PDF format.<br>
            Please show the QR code on your pass to the security for verification and identification during checkin and checkout.<br><br>
            Thank you,
            <b>SecurePass</b>
            `;

        await sendEmail({
            email: appointment.visitorId.email,
            subject: emailSubject,
            html: emailMessage,
            attachments: [{
                filename: 'visit-pass.pdf',
                path: pdfPath
            }]
        });
        
        res.status(201).json({
            message: 'Visitor invited successfully',
            appointment,
            pass: newPass
        });

    } catch (error) {
        console.error("Invite visitor error:", error.message);
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};

// ** Admin Management Section **

exports.getAllAppointmentsAdmin = async (req, res) => {
    try {
        const { status, search, hostId, startDate, endDate } = req.query;
        let query = { organizationName: req.user.organizationName };

        if (hostId && hostId !== 'All' && hostId !== 'undefined') query.hostId = hostId;

        // Filter by status
        if (status && status !== 'All Status' && status !== 'undefined') {
            query.status = status;
        }

        // Date range filter
        if (startDate && startDate !== 'undefined') {
            query.visitDate = { ...query.visitDate, $gte: new Date(startDate) };
        }
        if (endDate && endDate !== 'undefined') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set to end of the day
            query.visitDate = { ...query.visitDate, $lte: end };
        }

        // Search Filter (by name, email, or phone)
        const visitorPopulate = { path: 'visitorId' };
        if (search && search !== 'undefined' && search.trim !== '') {
            const safeSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'); // Escape special characters
            visitorPopulate.match = {
                $or: [
                    { name: { $regex: safeSearch, $options: 'i' } },
                    { email: { $regex: safeSearch, $options: 'i' } },
                    { phone: { $regex: safeSearch, $options: 'i' } }
                ]
             };
        }
        
        // Host filter
        const hostPopulate = { path: 'hostId', select: 'name email' };
        if (hostId && hostId !== 'All' && hostId !== 'undefined') {
            hostPopulate.match = { _id: hostId };
        }

        let appointments = await Appointment.find(query)
            .populate(visitorPopulate)
            .populate(hostPopulate)
            .sort({ createdAt: -1 }); // Sort by creation date

        // Backup array
        if (!appointments) appointments = [];

        // filter out unmatched populate results
        appointments = appointments.filter(app => app.visitorId !== null && app.hostId !== null);

        // Calculate stats cards
        const stats = {
            total: appointments.length,
            pending: appointments.filter(app => app.status === 'pending').length,
            approved: appointments.filter(app => app.status === 'approved').length,
            rejected: appointments.filter(app => app.status === 'rejected').length,
            completed: appointments.filter(app => app.status === 'completed').length
        }

        const hosts = await User.find({ role: 'host',
            organizationName: req.user.organizationName
        });

        res.status(200).json({
            success: true,
            appointments,
            stats,
            hosts
        });

    } catch (error) {
        console.error("Admin fetch all appointments error:", error.message);
        res.status(500).json({
            success: false,
            message: `Server Error fetching all appointments: ${error.message}`
        });
    }
};

exports.getAllPassesAdmin = async (req, res) => {
    try {
        const { hostId, search, startDate, endDate } = req.query;
        
        // Lock the quary to the admin's organization
        let query = { organizationName: req.user.organizationName };

        if (hostId && hostId !== 'All' && hostId !== 'undefined') query.hostId = hostId;

        // Date Range filter 
        if (startDate && startDate !== 'undefined') {
            query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
        }
        if (endDate && endDate !== 'undefined') {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set to end of the day
            query.createdAt = { ...query.createdAt, $lte: end };
        }

        // Search Filter (by name, email, or phone)
        const visitorPopulate = { path: 'visitorId' };
        if (search && search !== 'undefined' && search.trim() !== '') {
            const safeSearch = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"); // Escape special characters
            visitorPopulate.match = {
                $or: [
                    { name: { $regex: safeSearch, $options: 'i' } },
                    { email: { $regex: safeSearch, $options: 'i' } },
                    { phone: { $regex: safeSearch, $options: 'i' } }
                ]
            };
        }

        // Fetch all passes for the organization 
        const passes = await Pass.find(query)
            .populate('visitorId', 'name email phone company photoUrl')
            .populate('hostId', 'name email phone')
            .populate('appointmentId', 'purpose notes')
            .sort({ createdAt: -1 });

        // calculate stats cards
        const stats = {
            total: passes.length,
            active: passes.filter(p => p.status === 'active').length,
            expired: passes.filter(p => p.status === 'expired').length,
            used: passes.filter(p => p.status === 'used' || p.status === 'inactive').length,
            cancelled: passes.filter(p => p.status === 'cancelled').length,
        };

        const hosts = await User.find({ role:'host',
            organizationName: req.user.organizationName }).select('name');

        res.status(200).json({
            success: true,
            passes,
            stats,
            hosts
        });

    } catch (error) {
        console.error('Admin fetch all passes error:', error.message);
        res.status(500).json({ success: false, message: `Server Error fetching passes: ${error.message}` });
    }
};