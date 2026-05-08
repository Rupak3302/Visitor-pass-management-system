const Appointment = require('../models/appointmentModels');

const Pass = require('../models/passModels'); // the pass model
const sendEmail = require('../utils/emailService'); // the email service

const qrCode = require('qrcode'); // the qr code generator 
const PDFDocument = require('pdfkit'); // the pdf generator
const path = require('path');

// Create a new appointment
// POST /api/appointments
// Private (Admin and Host)
exports.scheduleAppointment = async (req, res) => {
    try {
        const { visitorId, date, time, purpose } = req.body;

        // The hostId is taken from the authenticated user making the request
        const hostId = req.user._id;  

        const appointment = await Appointment.create({
            visitorId,
            hostId,
            date,
            time,
            purpose,
            status: 'pending' // default state
        });
        
        res.status(201).json(appointment);

    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};

// Get appointments based on role
// GET /api/appointments
// Private (Admin, Hosts see only their own appointments))
exports.getAppointments = async (req, res) => {
    try {
        let filter = {};

        // If the user is a Hosts, admin they should only see their own appointments
        if (req.user.role?.toLowerCase() === 'host' || req.user.role?.toLowerCase() === 'admin' ) {
            filter.hostId = req.user._id;
        }

        // Filter by status if provided in query (e.g., ?status=approved)
        if (res.query.status) {
            filter.status = res.query.status; 
        }

        //Filter by date if provided in query (e.g., ?date=2024-07-01)
        if (res.query.date) {
            const start = new Date(res.query.date);
            const end = new Date(res.query.date);
            end.setHours(23, 59, 59, 999); // set to end of the day
            filter.visitDate = { $gte: start, $lte: end };
        }

        // If they Admin or Security, the query stay empty, means find all appointments 
        const appointments = await Appointment.find(filter)
            .populate('visitorId', 'name email phone photo purpose') // populate visitor details
            .populate('hostId', 'name email') // populate hosts details
            .sort({ visitDate: 1, visitTime: 1 }); // upcoming dates first 

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
        .populate('visitorId')
        .populate('hostId', 'name email phone');

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

// Approve appointment status
// PUT /api/appointments/:id/status 
// Private (Admin and Host)
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body; // expected to be 'approved' or 'rejected'

        // Find the appointment by ID so we can check the current status
        const appointment = await Appointment.findById(
            req.params.id
        ).populate('visitorId', 'name email');

        if (!appointment) {
            return res.status(404).json({
                message: 'Appointment not found'
            });
        }

        // only generate the pass if the status is changing to 'approved'
        if (status === 'approved' && appointment.status !== 'approved') {

            // the date goes inside the qr is the appointment ID for security reasons
            const qrDataString = JSON.stringify({
                appointmentId: appointment._id,
                visitorId: appointment.visitorId._id
            });
            
            // Generate the QR code image as a Base64  string
            const qrCodeImage = await qrCode.toDataURL(qrDataString);

            // Calculate the pass expiration time (e.g., end of the appointment day)
            const validUntil = new Date(appointment.date);
            validUntil.setHours(23, 59, 59, 999); // set to end of the day

            // Create the digital pass in the database
            const pass = await Pass.create({
                appointmentId: appointment._id,
                qrCodeData: qrCodeImage,
                validUntil: validUntil,
                status: 'active' // the pass is active when created
            });
        }

        // Send the approval Email
        try {
            await sendEmail({
                email: appointment.visitorId.email, // I do this because I used .populate()..  
                subject: 'Appointment Approved - Pass is Ready ( Go for download the pass)',
                message: `
                Your appointment is approved for ${appointment.visitTime}.`,
                html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #16a34a;">Appointment Approved ✅</h2>
                    <p>Hi <b>${appointment.visitorId.name}</b>,</p>
                    <p>Your appointment has been officially approved.</p>
                    <ul>
                      <li><b>Date:</b> ${new Date(appointment.visitDate).toLocaleDateString()}</li>
                      <li><b>Time:</b> ${appointment.visitTime}</li>
                      <li><b>Purpose:</b> ${appointment.purpose}</li>
                    </ul>
                    <p>Your secure digital pass has been generated. Please have your QR code ready to scan at the security desk upon arrival.</p>
                </div> `
            });                

        } catch (error) {
            console.log('Approvals email faild', error.message)
        }

        appointment.status = status; // update the appointment status
        await appointment.save(); // save the updated appointment

        res.status(200).json({
            message: `Appointment updated to ${status} successfully`,
            appointment
        });

    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
}

// Generate and download a PDF Badge
// GET /api/appointment/:id/badge
// Private (Admin, Security, Host)
exports.downloadBadge = async (req, res) => {
    try {

        // Fetch the appointment, generated pass and the visitor's photoUrl
        const appointment = await Appointment.findById(req.params.id)
            .populate('visitorId', 'name email phone company photoUrl')
        
        if (!appointment.visitorId) {
            return res.status(404).json({
                message: 'Visitor not found'
            });
        }

        if (appointment.status !== 'approved') {
            return res.status(400).json({
                message: 'Appointment must be approved first'
            });
        }

        const pass = await Pass.findOne({
            appointmentId: appointment._id
        })

        if (!pass || !pass.qrCodeData) {
            return res.status(404).json({
                message: 'Qr not generated yet'
            });
        }

        // Initialize the PDF Document (ID card size)
        const doc = new PDFDocument({
            size: [300, 500],
            margin: 0
        });

        // Sending a PDF file not JSON file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=VisitorBadge-${appointment.visitorId.name.replace(/\s+/g, '')}.pdf`);

        // Pipe the pdf directly to the user's browser download
        doc.pipe(res);

        // Design the PDF 
        
        // Header
        doc.rect(0, 0, 300, 60).fill('#2563eb');
        doc.fillColor('#ffffff').fontSize(20).text('VISITOR PASS', 0, 20, { align: 'center'});

        // Add the visitor photo
        if (appointment.visitorId.photoUrl) {
            const photoPath = path.join(__dirname, '..', appointment.visitorId.photoUrl);
            // Image Size
            doc.image(photoPath, 100, 80, { align: 'center', width: 60, height: 60, fit: [100, 80] });
        }

        // Visitor Details
        doc.fillColor('#000000').fontSize(18).text(appointment.visitorId.name, 0, 180, { align: 'center'});

        doc.fontSize(12).fillColor('#64748b').moveDown(0.5);
        if (appointment.visitorId.email) doc.text(appointment.visitorId.email, { align: 'center' });
        if (appointment.visitorId.phone) doc.text(appointment.visitorId.phone, { align: 'center' });
        doc.text(appointment.visitorId.company || 'Guest', { align: 'center' });


        // Appoinment Details
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#000000');
        doc.text(`Date: ${new Date(appointment.date).toLocaleDateString()}`, { align: 'center'});
        doc.text(`Time: ${appointment.time}`, { align: 'center'});

        // QR Code
        // this splits off the "data:image/png.base64," part and turns the rest into a 
        try {
            const qrBuffer = Buffer.from(pass.qrCodeData.split(',')[1], 'base64');
            doc.image(qrBuffer, 105, 290, { align: 'center', width: 100, height: 100 }); 
        } catch (err) {
            console.log("Could not load QR code:", err.message);
        }

        // Footer

        doc.rect(0, 470, 500, 30).fill('#f1f5f9');
        doc.fontSize(10).fillColor('#92a3b8').text('Please wear this badge at all times.', 0, 400, { align: 'center'});

        doc.end();

    } catch (error) {
        res.status(500).json({
            message: `Server Error: ${error.message}`
        });
    }
};