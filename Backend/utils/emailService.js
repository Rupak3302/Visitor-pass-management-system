const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // create a transporter (the 'mail truck')
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Define the email options
        const mailOptions = {
            from:`Visitor Pass Management System <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message, // Plain text
            html: options.html, // html version
            attachments: options.attachments
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        
        console.log(`Email successfully sent to ${options.email}`);

    } catch (error) {
        console.error('Error sending email:', error.message);
    }  
};

module.exports = sendEmail;