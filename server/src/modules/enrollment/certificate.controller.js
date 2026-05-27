import Enrollment from './enrollment.model.js';
import Course from '../course/course.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { generateCertificatePDF } from '../../utils/certificate.js';
import { transactionalEmailQueue } from '../../queues/index.js';
import crypto from 'crypto';

export const generateCertificate = catchAsync(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    user: req.userId,
    course: req.params.courseId,
    status: 'completed',
  });

  if (!enrollment) {
    throw ApiError.notFound('Completed enrollment not found. Finish the course first.');
  }

  // Return cached certificate URL if already generated
  if (enrollment.certificateUrl) {
    return ApiResponse.ok(res, { certificateUrl: enrollment.certificateUrl });
  }

  const [course, user] = await Promise.all([
    Course.findById(req.params.courseId).select('title'),
    User.findById(req.userId).select('name email'),
  ]);

  if (!course || !user) throw ApiError.notFound('Course or user not found');

  // Assign certificateId if not present
  if (!enrollment.certificateId) {
    enrollment.certificateId = crypto.randomBytes(8).toString('hex').toUpperCase();
    enrollment.certificateIssued = true;
    await enrollment.save();
  }

  const certificateUrl = await generateCertificatePDF({ user, course, enrollment });

  // Cache the URL on the enrollment
  enrollment.certificateUrl = certificateUrl;
  await enrollment.save();

  // Email the certificate
  await transactionalEmailQueue.add('send', {
    type: 'certificate',
    data: { user, course, certificateUrl },
  });

  ApiResponse.ok(res, { certificateUrl }, 'Certificate generated');
});

export const verifyCertificatePublic = catchAsync(async (req, res) => {
  const { certificateId } = req.params;

  const enrollment = await Enrollment.findOne({ certificateId })
    .populate('user', 'name email')
    .populate('course', 'title');

  if (!enrollment) {
    throw ApiError.notFound('Certificate not found');
  }

  ApiResponse.ok(
    res,
    {
      valid: true,
      certificateId: enrollment.certificateId,
      studentName: enrollment.user?.name || 'Unknown Student',
      courseTitle: enrollment.course?.title || 'Unknown Course',
      issuedAt: enrollment.updatedAt,
      certificateUrl: enrollment.certificateUrl,
    },
    'Certificate verified successfully'
  );
});
