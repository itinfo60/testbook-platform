import Enrollment from './enrollment.model.js';
import Course from '../course/course.model.js';
import User from '../user/user.model.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { generateCertificatePDF } from '../../utils/certificate.js';
import { transactionalEmailQueue } from '../../queues/index.js';

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
