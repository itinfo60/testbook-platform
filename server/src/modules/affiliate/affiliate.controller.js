import prisma from '../../config/prisma.js';
import crypto from 'crypto';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

const generateCode = (userId) =>
  `REF${userId.toString().slice(-4).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * POST /api/v1/affiliate/register — Register as an affiliate and get a referral code
 */
export const registerAffiliate = catchAsync(async (req, res) => {
  const existing = await prisma.referral.findFirst({ where: { user: req.userId } });
  if (existing)
    return ApiResponse.ok(res, { affiliate: existing }, 'Already registered as affiliate');

  const referralCode = generateCode(req.userId);
  const affiliate = await prisma.referral.create({
    data: {
      user: req.userId,
      referralCode,
      commissionRate: 10,
    },
  });

  ApiResponse.created(res, { affiliate }, 'Affiliate account created');
});

/**
 * GET /api/v1/affiliate/me — Get my affiliate stats
 */
export const getMyAffiliate = catchAsync(async (req, res) => {
  const affiliate = await prisma.referral.findFirst({ where: { user: req.userId } });
  if (!affiliate) throw ApiError.notFound('Affiliate account not found. Register first.');

  const records = await prisma.referralRecord
    .findMany({ where: { referrer: req.userId } })
    .populate('referred', 'name email createdAt')
    .sort({ createdAt: -1 })
    .limit(50);

  ApiResponse.ok(res, { affiliate, records });
});

/**
 * GET /api/v1/affiliate/validate/:code — Validate referral code (used at checkout)
 */
export const validateReferralCode = catchAsync(async (req, res) => {
  const { code } = req.params;
  const affiliate = await prisma.referral
    .findFirst({
      where: {
        referralCode: code.toUpperCase(),
        isActive: true,
      },
    })
    .populate('user', 'name');
  if (!affiliate) throw ApiError.notFound('Invalid referral code');
  ApiResponse.ok(res, {
    valid: true,
    referrerName: affiliate.user?.name,
    commissionRate: affiliate.commissionRate,
  });
});

/**
 * Internal: Record a referral when a referred user makes a payment.
 * Called from payment controller after successful payment.
 */
export const recordReferralConversion = async ({
  referralCode,
  referredUserId,
  paymentId,
  amount,
}) => {
  if (!referralCode) return;

  const affiliate = await prisma.referral.findFirst({
    where: {
      referralCode: referralCode.toUpperCase(),
      isActive: true,
    },
  });
  if (!affiliate) return;

  const commission = Math.round((affiliate.commissionRate / 100) * amount * 100) / 100;

  await prisma.referralRecord.create({
    data: {
      referralCode,
      referrer: affiliate.user,
      referred: referredUserId,
      payment: paymentId,
      commissionAmount: commission,
      status: 'pending',
    },
  });

  await prisma.referral.update({
    where: { id: affiliate.id },
    data: {
      totalReferrals: { increment: 1 },
      totalEarnings: { increment: commission },
      pendingPayout: { increment: commission },
    },
  });
};

/**
 * [ADMIN] GET /api/v1/affiliate/admin — List all affiliates
 */
export const listAffiliates = catchAsync(async (req, res) => {
  const affiliates = await prisma.referral
    .findMany({})
    .populate('user', 'name email')
    .sort({ totalEarnings: -1 });
  ApiResponse.ok(res, { affiliates, count: affiliates.length });
});

/**
 * [ADMIN] POST /api/v1/affiliate/admin/:id/payout — Mark payout processed
 */
export const processPayout = catchAsync(async (req, res) => {
  const { id } = req.params;
  const affiliate = await prisma.referral.findUnique({ where: { id: id } });
  if (!affiliate) throw ApiError.notFound('Affiliate not found');

  const amount = affiliate.pendingPayout;
  await prisma.referral.update({
    where: { id },
    data: {
      paidOut: { increment: amount },
      pendingPayout: 0,
    },
  });

  await prisma.referralRecord.updateMany({
    where: { referrer: affiliate.user, status: 'approved' },
    data: { status: 'paid', paidAt: new Date() },
  });

  ApiResponse.ok(res, { paidAmount: amount }, `Payout of ₹${amount} processed`);
});
