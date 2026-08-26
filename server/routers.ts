import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from './db';
import { orderItems, orders, products } from '../drizzle/schema';

const orderItemSchema = z.object({ productId: z.number().int().positive(), productName: z.string().min(1).max(180), size: z.string().max(30).optional(), quantity: z.number().int().positive().max(20), unitPrice: z.number().nonnegative() });
export const orderSchema = z.object({ customerName: z.string().min(2).max(180), phone: z.string().min(7).max(40), email: z.string().email().optional().or(z.literal('')), address: z.string().min(5), city: z.string().min(2).max(120), state: z.string().min(2).max(120), pincode: z.string().min(4).max(20), landmark: z.string().max(180).optional(), items: z.array(orderItemSchema).min(1), subtotal: z.number().nonnegative() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  catalog: router({
    list: publicProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(products).where(eq(products.status, 'active')); }),
    adminList: adminProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(products); }),
    create: adminProcedure.input(z.object({ name: z.string().min(2).max(180), slug: z.string().min(2).max(200), description: z.string().optional(), price: z.number().nonnegative(), sizes: z.array(z.string()).min(1), stock: z.number().int().nonnegative(), imageUrl: z.string().url().optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error('Product service is temporarily unavailable.'); const [created] = await db.insert(products).values({ name: input.name, slug: input.slug, description: input.description || null, price: input.price.toFixed(2), sizes: input.sizes, stock: input.stock, imageUrl: input.imageUrl || null, status: 'active' }); return { id: Number((created as any).insertId) }; }),
  }),
  orders: router({
    list: adminProcedure.query(async () => { const db = await getDb(); if (!db) return []; return db.select().from(orders); }),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(['pending','confirmed','processing','shipped','delivered','cancelled']) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new Error('Order service is temporarily unavailable.'); await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id)); return { success: true }; }),
    request: publicProcedure.input(orderSchema).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Order service is temporarily unavailable. Please try again shortly.');
      const [created] = await db.insert(orders).values({ customerName: input.customerName, phone: input.phone, email: input.email || null, address: input.address, city: input.city, state: input.state, pincode: input.pincode, landmark: input.landmark || null, subtotal: input.subtotal.toFixed(2), total: input.subtotal.toFixed(2), paymentStatus: 'not_applicable', status: 'pending' });
      const orderId = Number((created as any).insertId);
      await db.insert(orderItems).values(input.items.map(item => ({ orderId, productId: item.productId, productName: item.productName, size: item.size || null, quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2) })));
      return { orderId };
    }),
  }),
});
export type AppRouter = typeof appRouter;
