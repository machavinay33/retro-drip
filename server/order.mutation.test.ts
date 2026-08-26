import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock('./db', () => ({ getDb: getDbMock }));

import { appRouter } from './routers';

const payload = { customerName: 'Asha Rao', phone: '9876543210', email: 'asha@example.com', address: '12 Archive Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', landmark: '', subtotal: 2499, items: [{ productId: 2, productName: 'Utility Denim 01', size: '32', quantity: 1, unitPrice: 2499 }] };
const ctx = { user: null, req: {} as any, res: {} as any };

describe('orders.request mutation', () => {
  beforeEach(() => getDbMock.mockReset());

  it('inserts an order and item snapshot with no payment status', async () => {
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 42 }]);
    const insert = vi.fn(() => ({ values: insertValues }));
    getDbMock.mockResolvedValue({ insert });
    const result = await appRouter.createCaller(ctx).orders.request(payload);
    expect(result).toEqual({ orderId: 42 });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insertValues).toHaveBeenCalled();
    expect(insertValues.mock.calls[0]?.[0]).toMatchObject({ paymentStatus: 'not_applicable', status: 'pending', total: '2499.00' });
  });

  it('returns a safe error when the database is unavailable', async () => {
    getDbMock.mockResolvedValue(null);
    await expect(appRouter.createCaller(ctx).orders.request(payload)).rejects.toThrow('Order service is temporarily unavailable');
  });
});
