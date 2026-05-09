const Appointment = require('../models/appointmentModels'); // the appointment model
const Visitor = require('../models/visitorModels'); // the visitor model

// const Pass = require('../models/passModels'); // the pass model
const sendEmail = require('../utils/emailService'); // the email service

// const qrCode = require('qrcode'); // the qr code generator 
// const PDFDocument = require('pdfkit'); // the pdf generator
// const path = require('path');

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
        if (res.query.status) {
            filter.status = res.query.status; 
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
            .populate('visitorId', 'name email phone photo purpose') // populate visitor details
            .populate('hostId', 'name email') // populate hosts details
            .populate('actionBy', 'name') // populate who approved/rejected the appointment
            .sort({ visitDate: 1}); // upcoming dates first 

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

exports.getMyAppointments = async (req, res) => {
    try {
        // Only the host can see their appointments
        const appointments = await Appointment.find({ hostId: req.user._id })
        .populate('visitorId', 'name email phone company photo')
        .sort({ createdAt: -1 });
        
        res.status(200).json({ appointments });

    } catch (error) {
        console.error("Get appointments error:", error.message);
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
        .populate('visitorId')
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
        await appointment.populate('visitorId', 'name email phone');
        await appointment.populate('hostId', 'name email');

        // Prepare the email notification to the visitor based on the new status
        let emailSubject = '';
        let emailMessage = '';

        if (status === 'approved') {
            emailSubject = 'Your Appointment is Approved - SecurePass';
            emailMessage = `
                Hello, ${appointment.visitorId.name},
                
                Your visit scheduled for ${new Date(appointment.visitDate).toLocaleDateString()} at ${appointment.visitTime} has been Approved by ${req.user.name}.
                `;
        
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
                message: emailMessage,
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

// Generate and download a PDF Badge
// GET /api/appointment/:id/badge
// Private (Admin, Security, Host)
// exports.downloadBadge = async (req, res) => {
//     try {

//         // Fetch the appointment, generated pass and the visitor's photoUrl
//         const appointment = await Appointment.findById(req.params.id)
//             .populate('visitorId', 'name email phone company photoUrl')
        
//         if (!appointment.visitorId) {
//             return res.status(404).json({
//                 message: 'Visitor not found'
//             });
//         }

//         if (appointment.status !== 'approved') {
//             return res.status(400).json({
//                 message: 'Appointment must be approved first'
//             });
//         }

//         const pass = await Pass.findOne({
//             appointmentId: appointment._id
//         })

//         if (!pass || !pass.qrCodeData) {
//             return res.status(404).json({
//                 message: 'Qr not generated yet'
//             });
//         }

//         // Initialize the PDF Document (ID card size)
//         const doc = new PDFDocument({
//             size: [300, 500],
//             margin: 0
//         });

//         // Sending a PDF file not JSON file
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=VisitorBadge-${appointment.visitorId.name.replace(/\s+/g, '')}.pdf`);

//         // Pipe the pdf directly to the user's browser download
//         doc.pipe(res);

//         // Design the PDF 
        
//         // Header
//         doc.rect(0, 0, 300, 60).fill('#2563eb');
//         doc.fillColor('#ffffff').fontSize(20).text('VISITOR PASS', 0, 20, { align: 'center'});

//         // Add the visitor photo
//         if (appointment.visitorId.photoUrl) {
//             const photoPath = path.join(__dirname, '..', appointment.visitorId.photoUrl);
//             // Image Size
//             doc.image(photoPath, 100, 80, { align: 'center', width: 60, height: 60, fit: [100, 80] });
//         }

//         // Visitor Details
//         doc.fillColor('#000000').fontSize(18).text(appointment.visitorId.name, 0, 180, { align: 'center'});

//         doc.fontSize(12).fillColor('#64748b').moveDown(0.5);
//         if (appointment.visitorId.email) doc.text(appointment.visitorId.email, { align: 'center' });
//         if (appointment.visitorId.phone) doc.text(appointment.visitorId.phone, { align: 'center' });
//         doc.text(appointment.visitorId.company || 'Guest', { align: 'center' });


//         // Appoinment Details
//         doc.moveDown(1);
//         doc.fontSize(12).fillColor('#000000');
//         doc.text(`Date: ${new Date(appointment.date).toLocaleDateString()}`, { align: 'center'});
//         doc.text(`Time: ${appointment.time}`, { align: 'center'});

//         // QR Code
//         // this splits off the "data:image/png.base64," part and turns the rest into a 
//         try {
//             const qrBuffer = Buffer.from(pass.qrCodeData.split(',')[1], 'base64');
//             doc.image(qrBuffer, 105, 290, { align: 'center', width: 100, height: 100 }); 
//         } catch (err) {
//             console.log("Could not load QR code:", err.message);
//         }

//         // Footer

//         doc.rect(0, 470, 500, 30).fill('#f1f5f9');
//         doc.fontSize(10).fillColor('#92a3b8').text('Please wear this badge at all times.', 0, 400, { align: 'center'});

//         doc.end();

//     } catch (error) {
//         res.status(500).json({
//             message: `Server Error: ${error.message}`
//         });
//     }
// };