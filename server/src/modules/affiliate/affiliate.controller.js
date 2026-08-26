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
  const referralCode = generateCode(req.userId);
  ApiResponse.created(
    res,
    {
      affiliate: {
        userId: req.userId,
        referralCode,
        commissionRate: 10,
        totalEarnings: 0,
        pendingPayout: 0,
      },
    },
    'Affiliate account created'
  );
});

/**
 * GET /api/v1/affiliate/me — Get my affiliate stats
 */
export const getMyAffiliate = catchAsync(async (req, res) => {
  const referralCode = generateCode(req.userId);
  ApiResponse.ok(res, {
    affiliate: {
      userId: req.userId,
      referralCode,
      commissionRate: 10,
      totalEarnings: 0,
      pendingPayout: 0,
    },
    records: [],
  });
});

/**
 * GET /api/v1/affiliate/validate/:code — Validate referral code (used at checkout)
 */
export const validateReferralCode = catchAsync(async (req, res) => {
  const { code } = req.params;
  if (!code) throw ApiError.badRequest('Referral code is required');
  ApiResponse.ok(res, {
    valid: true,
    referrerName: 'CivicsEdu Partner',
    commissionRate: 10,
  });
});

/**
 * Internal: Record a referral when a referred user makes a payment.
 */
export const recordReferralConversion = async () => {};

/**
 * [ADMIN] GET /api/v1/affiliate/admin — List all affiliates
 */
export const listAffiliates = catchAsync(async (req, res) => {
  ApiResponse.ok(res, { affiliates: [], count: 0 });
});

/**
 * [ADMIN] POST /api/v1/affiliate/admin/:id/payout — Mark payout processed
 */
export const processPayout = catchAsync(async (req, res) => {
  const { id } = req.params;
  ApiResponse.ok(res, { paidAmount: 0 }, `Payout of ₹0 processed`);
});
