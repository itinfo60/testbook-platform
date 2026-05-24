import { describe, it, expect, vi } from 'vitest';
import catchAsync from '../../src/utils/catchAsync.js';

describe('catchAsync', () => {
  it('should call the wrapped function and not call next if it succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const wrapped = catchAsync(fn);
    
    const req = {};
    const res = {};
    const next = vi.fn();

    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch errors and pass them to next', async () => {
    const error = new Error('Test Error');
    const fn = vi.fn().mockRejectedValue(error);
    const wrapped = catchAsync(fn);
    
    const req = {};
    const res = {};
    const next = vi.fn();

    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
