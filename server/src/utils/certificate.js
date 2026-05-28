import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';
import logger from './logger.js';

/**
 * Generate a PDF certificate and upload to Cloudinary.
 * Returns the secure URL of the uploaded PDF.
 */
export async function generateCertificatePDF({ user, course, enrollment }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50,
      info: {
        Title: `Certificate of Completion - ${course.title}`,
        Author: 'TestBook Platform',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);

      const FALLBACK_URL =
        'https://placehold.co/1123x794/4f46e5/white?text=Certificate+of+Completion';

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
      const apiKey = process.env.CLOUDINARY_API_KEY || '';
      const isCloudinaryConfigured =
        cloudName &&
        cloudName !== 'disabled' &&
        !cloudName.startsWith('your-') &&
        apiKey &&
        !apiKey.startsWith('your-');

      if (!isCloudinaryConfigured) {
        resolve(FALLBACK_URL);
        return;
      }

      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'certificates',
          public_id: `cert_${enrollment._id}`,
          format: 'pdf',
        },
        (err, result) => {
          if (err) {
            logger.error('Cloudinary certificate upload failed:', err.message);
            resolve(FALLBACK_URL);
          } else {
            resolve(result.secure_url);
          }
        }
      );

      stream.on('error', (err) => {
        logger.error('Certificate stream error:', err.message);
        resolve(FALLBACK_URL);
      });

      stream.end(buffer);
    });

    const certId = enrollment.certificateId || crypto.randomBytes(8).toString('hex').toUpperCase();
    const issuedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const W = doc.page.width;
    const H = doc.page.height;

    // Background gradient simulation
    doc.rect(0, 0, W, H).fill('#F8F9FF');

    // Top decorative bar
    doc.rect(0, 0, W, 12).fill('#4F46E5');

    // Bottom bar
    doc.rect(0, H - 12, W, 12).fill('#4F46E5');

    // Left/right accent lines
    doc.rect(30, 30, 4, H - 60).fill('#4F46E5');
    doc.rect(W - 34, 30, 4, H - 60).fill('#4F46E5');

    // Platform name
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#4F46E5')
      .text('TESTBOOK PLATFORM', 50, 50, { align: 'center', width: W - 100 });

    // Title
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#6B7280')
      .text('CERTIFICATE OF COMPLETION', 50, 75, { align: 'center', width: W - 100 });

    // Decorative divider
    doc
      .moveTo(W / 2 - 150, 100)
      .lineTo(W / 2 + 150, 100)
      .strokeColor('#C7D2FE')
      .lineWidth(1)
      .stroke();

    // "This is to certify that"
    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#374151')
      .text('This is to certify that', 50, 120, { align: 'center', width: W - 100 });

    // Student name
    doc
      .font('Helvetica-Bold')
      .fontSize(36)
      .fillColor('#1E1B4B')
      .text(user.name, 50, 148, { align: 'center', width: W - 100 });

    // Underline for name
    const nameWidth = Math.min(doc.widthOfString(user.name, { fontSize: 36 }), 400);
    doc
      .moveTo(W / 2 - nameWidth / 2, 195)
      .lineTo(W / 2 + nameWidth / 2, 195)
      .strokeColor('#4F46E5')
      .lineWidth(2)
      .stroke();

    // "has successfully completed"
    doc
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#374151')
      .text('has successfully completed the course', 50, 208, { align: 'center', width: W - 100 });

    // Course title
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#4F46E5')
      .text(course.title, 50, 232, { align: 'center', width: W - 100 });

    // Stats row
    const statsY = 290;
    const statItems = [
      { label: 'Issue Date', value: issuedDate },
      { label: 'Certificate ID', value: certId },
      { label: 'Progress', value: `${Math.round(enrollment.progressPercentage || 100)}%` },
    ];
    const colW = (W - 100) / 3;
    statItems.forEach((item, i) => {
      const x = 50 + i * colW;
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#9CA3AF')
        .text(item.label, x, statsY, { width: colW, align: 'center' });
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#1F2937')
        .text(item.value, x, statsY + 16, { width: colW, align: 'center' });
    });

    // Verification note
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#9CA3AF')
      .text(
        `Verify at: ${process.env.CLIENT_URL || 'https://app.testbook.com'}/verify-certificate?id=${certId}`,
        50,
        H - 45,
        {
          align: 'center',
          width: W - 100,
        }
      );

    doc.end();
  });
}
