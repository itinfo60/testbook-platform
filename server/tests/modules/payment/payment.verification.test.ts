import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';

vi.mock('../../../src/config/prisma.js', () => ({
  default: { payment: { findFirst: vi.fn(), update: vi.fn() } },
}));
vi.mock('../../../src/config/index.js', () => ({
  default: { razorpay: { keyId: 'test_key', keySecret: 'test_secret' } },
}));
vi.mock('../../../src/config/redis.js', () => ({ default: {} }));
vi.mock('../../../src/utils/logger.js', () => ({ default: {} }));
vi.mock('../../../src/queues/index.js', () => ({
  transactionalEmailQueue: {},
  notificationQueue: {},
}));

import prisma from '../../../src/config/prisma.js';
import config from '../../../src/config/index.js';
import { PaymentService } from '../../../src/modules/payment/payment.service.js';

const data = {
  razorpay_order_id: 'order_real',
  razorpay_payment_id: 'pay_test',
  razorpay_signature: 'mock_signature',
};

describe('Payment signature verification', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOW_MOCK_PAYMENTS', 'false');
    config.razorpay.keySecret = 'test_secret';
    vi.mocked(prisma.payment.findFirst).mockResolvedValue({ id: 'payment', notes: {} } as any);
    vi.mocked(prisma.payment.update).mockResolvedValue({
      id: 'payment',
      status: 'completed',
    } as any);
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['order_real', 'order_mock_123'])(
    'rejects mock signatures without opt-in for %s',
    async (orderId) => {
      await expect(
        new PaymentService().verifyPayment('user', null, {
          ...data,
          razorpay_order_id: orderId,
        })
      ).rejects.toThrow('invalid signature');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    }
  );

  it('still verifies real orders when mock payments are enabled', async () => {
    vi.stubEnv('ALLOW_MOCK_PAYMENTS', 'true');
    await expect(new PaymentService().verifyPayment('user', null, data)).rejects.toThrow(
      'invalid signature'
    );
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('fails closed if the gateway secret is missing', async () => {
    config.razorpay.keySecret = '';
    const service = new PaymentService();
    expect(service.razorpay).toBeNull();
    await expect(service.verifyPayment('user', null, data)).rejects.toThrow(
      'Payment gateway not configured'
    );
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('accepts a valid signature and scopes the payment lookup to its owner', async () => {
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');
    await expect(
      new PaymentService().verifyPayment('user', null, {
        ...data,
        razorpay_signature: signature,
      })
    ).resolves.toMatchObject({ payment: { status: 'completed' } });
    expect(prisma.payment.findFirst).toHaveBeenCalledWith({
      where: { orderId: 'order_real', userId: 'user' },
    });
  });

  it('preserves explicitly enabled mock checkout verification', async () => {
    vi.stubEnv('ALLOW_MOCK_PAYMENTS', 'true');
    await expect(
      new PaymentService().verifyPayment('user', null, {
        ...data,
        razorpay_order_id: 'order_mock_123',
      })
    ).resolves.toMatchObject({ payment: { status: 'completed' } });
  });
});
