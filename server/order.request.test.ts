import { describe, expect, it } from 'vitest';
import { orderSchema } from './routers';

describe('order request validation', () => {
  it('accepts a complete no-payment request', () => {
    const result = orderSchema.safeParse({ customerName: 'Asha Rao', phone: '9876543210', email: 'asha@example.com', address: '12 Archive Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', landmark: 'Near station', subtotal: 2499, items: [{ productId: 2, productName: 'Utility Denim 01', size: '32', quantity: 1, unitPrice: 2499 }] });
    expect(result.success).toBe(true);
  });

  it('rejects a request without customer contact or items', () => {
    const result = orderSchema.safeParse({ customerName: '', phone: '', address: 'x', city: 'M', state: 'M', pincode: '1', subtotal: 0, items: [] });
    expect(result.success).toBe(false);
  });
});
