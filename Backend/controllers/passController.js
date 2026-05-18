const QRCode = require('qrcode'); // the qr code generator 
const PDFDocument = require('pdfkit'); // the pdf generator
const fs = require('fs'); // file system module
const path = require('path'); // path module

// Generate the QR code
exports.generateQRCode = async (passCode) => {
    try {

        //Generate the base64 string of the QR code image
        const qrCodeImage = await QRCode.toDataURL(passCode);
        
        return qrCodeImage;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

// Generate the PDF Badge
exports.generatePDFBadge = async (visitor, appointment, qrCodeImage, passCode) => {
    return new Promise((resolve, reject) => {
        try {
            // Define where to save the temporary PDF file
            const pdfPath = path.join(__dirname, `../TempPDFs/Pass_${passCode}.pdf`);

            // Create a new PDF document
            const doc = new PDFDocument({ size: 'A6', margin: 0 });
            const stream = fs.createWriteStream(pdfPath);
            doc.pipe(stream);

            // Design the PDF Badge

            // Header
            doc.rect(0, 0, doc.page.width, 50).fill('#1e40af'); // Blue header
            doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('Visitor Pass', 0, 18, { align: 'center'});

            // visitor photo in left side(rounded)
            const photoX = 20;
            const photoY = 70;
            const photoSize = 65;

            console.log('PDF Tracker : Visitor photom URL from DB', visitor.photoUrl);

            if (visitor.photoUrl) {
                const photoPath = path.join(__dirname, '../uploads', visitor.photoUrl);
                console.log('PDF Tracker : Searching hard drive for ', photoPath);
                
                // If the visitor has a photo, display it
                if (fs.existsSync(photoPath)) {
                    console.log('PDF Tracker : Success! Image found , drawing on PDF..');
                    doc.save(); // Save the current structure
                    
                    // Draw a rounded rectangle for the photo
                    doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2).clip();
                    doc.image(photoPath, photoX, photoY, { width: photoSize, height: photoSize });
                    doc.restore(); // Restore the previous structure
                    
                } else {
                    console.log('PDF Tracker : Faild! File dose not exist at that path');
                }
            } else {
                console.log('PDF Tracker : Skipped! Database says visitor has no photo');
            }

            // visitors details in right side
            const textX = 100;
            let textY = 75;

            doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text(visitor.name, textX, textY);

            textY += 16;
            doc.fontSize(8).font('Helvetica').text(`Email: ${visitor.email}`, textX, textY);

            textY += 12;
            doc.text(`Phone: ${visitor.phone}`, textX, textY);

            textY += 12;
            const finalPurpose = visitor.purpose || appointment.purpose;
            doc.text(`Purpose: ${finalPurpose}`, textX, textY);

            // Validity
            textY += 12;
            let visitDate = new Date(appointment.visitDate).toLocaleDateString();
            doc.text(`Visit Date: ${visitDate} at ${appointment.visitTime} ( Valid for 24 hours )`, textX, textY);
            
            // Add the QR code image
            const qrSize = 120;
            const qrY = 170;
            // When have to strip the base64 prefix so PDFKit can read it
            const base64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            doc.image(imageBuffer, (doc.page.width - qrSize) / 2, qrY, { width: qrSize });

            // Backup Passcode
            doc.fontSize(14).font('Helvetica-Bold').text(`Code: ${passCode}`, 0, qrY + qrSize + 10, { align: 'center'});

            // Footer
            doc.fontSize(8).font('Helvetica').fillColor('gray').text('Please present this pass at the entrance.', 0, doc.page.height - 30, { align: 'center'});

            doc.end();

            // wait for the PDF to finish saving before resolving the promise
            stream.on('finish', () => {
                resolve(pdfPath);
            });
            
            stream.on('error', (error) => {
                reject(error);
            });
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            reject(error);
        }
    });  
};
