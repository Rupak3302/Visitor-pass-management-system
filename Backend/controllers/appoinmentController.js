const Appointment = require('../models/appointmentModels'); // the appointment model
const Visitor = require('../models/visitorModels'); // the visitor model
const Pass = require('../models/passModels'); // the pass model
const { generateQRCode, generatePDFBadge } = require('../controllers/passController');
const sendEmail = require('../utils/emailService'); // the email service
// const sendSMS = require('../utils/smsService'); // the sms service
const crypto = require('crypto'); // for generating random numbers


// Get all appointments (with Search, Filter & Role check)
// GET /api/appointments
// Private (Admin see all appointments, Host see only their own appointments)
exports.getAppointments = async (req, res) => {
    try {
        let filter = {};

        // If the user is a Host, they can only see their own appointments
        // If the user is an Admin, they can see all appointments
        if (req.user.role?.toLowerCase() === 'host' || req.user.role?.toLowerCase() === 'admin' ) {
            filter.hostId = req.user._id;
        }

        // Filter by status if provided in query (e.g., ?status=approved)
        if (req.query.status) {
            filter.status = req.query.status; 
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
    try {
        const { status, rejectionReason } = req.body; // expected to be 'approved', 'rejected'
        const appointmentId = req.params.id;

        // Find the appointment and populate visitor details for email
        const appointment = await Appointment.findById(appointmentId).populate('visitorId')

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        // Make sure the login hosts actually owns this appointment 
        // (Admin can update any appointment, but Host can only update their own appointments)
        if (appointment.hostId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Not authorized to update this appointment'
            });
        }

        // Update the appointment status and save in DB
        appointment.status = status;
        appointment.actionBy = req.user._id; // track who approved/rejected 
        appointment.actionAt = new Date(); // track when the status was updated

        // If the status is rejected, save the rejection reason
        if (status === 'rejected' && rejectionReason) {
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
            validUntil.setHours(23, 59, 59, 999); // Set time to 11:59:59 PM to end

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
                <b> The pass Attachment is attached below in PDF format </b><br>
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

// // Create a new appointment
// // POST /api/appointments
// // Private (Admin and Host)
// exports.scheduleAppointment = async (req, res) => {
//     try {
//         const { visitorId, date, time, purpose } = req.body;

//         // The hostId is taken from the authenticated user making the request
//         const hostId = req.user._id;  

//         const appointment = await Appointment.create({
//             visitorId,
//             hostId,
//             date,
//             time,
//             purpose,
//             status: 'pending' // default state
//         });
        
//         res.status(201).json(appointment);

//     } catch (error) {
//         res.status(500).json({
//             message: `Server Error: ${error.message}`
//         });
//     }
// };