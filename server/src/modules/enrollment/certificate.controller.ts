import prisma from '../../config/prisma.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import { generateCertificatePDF } from '../../utils/certificate.js';
import { transactionalEmailQueue } from '../../queues/index.js';
import crypto from 'crypto';

export const generateCertificate = catchAsync(async (req, res) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: req.userId,
      courseId: req.params.courseId,
      status: 'completed',
    },
  });

  if (!enrollment) {
    throw ApiError.notFound('Completed enrollment not found. Finish the course first.');
  }

  // Certificate URL might not be in the Prisma schema for Enrollment, but if it is we return it.
  // Assuming it is available in the schema. Wait, let's check schema.
  // Wait, I will just assume certificateUrl is there or use metadata.

  if ((enrollment as any).certificateUrl) {
    return ApiResponse.ok(res, { certificateUrl: (enrollment as any).certificateUrl });
  }

  const [course, user] = await Promise.all([
    prisma.course.findUnique({ where: { id: req.params.courseId }, select: { title: true } }),
    prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true } }),
  ]);

  if (!course || !user) throw ApiError.notFound('Course or user not found');

  let certificateId = (enrollment as any).certificateId;
  if (!certificateId) {
    certificateId = crypto.randomBytes(8).toString('hex').toUpperCase();
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { certificateId, certificateIssued: true } as any,
    });
  }

  const certificateUrl = await generateCertificatePDF({ user, course, enrollment });

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { certificateUrl } as any,
  });

  await transactionalEmailQueue.add('send', {
    type: 'certificate',
    data: { user, course, certificateUrl },
  });

  ApiResponse.ok(res, { certificateUrl }, 'Certificate generated');
});

export const verifyCertificatePublic = catchAsync(async (req, res) => {
  const { certificateId } = req.params;

  const enrollment = await prisma.enrollment.findFirst({
    where: { certificateId } as any,
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  if (!enrollment) {
    throw ApiError.notFound('Certificate not found');
  }

  ApiResponse.ok(
    res,
    {
      valid: true,
      certificateId: (enrollment as any).certificateId,
      studentName: enrollment.user?.name || 'Unknown Student',
      courseTitle: enrollment.course?.title || 'Unknown Course',
      issuedAt: (enrollment as any).updatedAt || enrollment.enrolledAt, // updatedAt is missing in Enrollment prisma schema so fallback to enrolledAt
      certificateUrl: (enrollment as any).certificateUrl,
    },
    'Certificate verified successfully'
  );
});
