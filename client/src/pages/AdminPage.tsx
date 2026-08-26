import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = (typeof orderStatuses)[number];

type ProductRow = {
  id: string | number;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  status: string;
  image_url: string | null;
};

type OrderRow = {
  id: string | number;
  customer_name: string;
  phone: string;
  total: number | string;
  status: OrderStatus;
  created_at: string;
};

const blankProduct = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '0',
  sizes: 'S, M, L, XL',
  imageUrl: '',
};

export default function AdminPage() {
  const { user, loading, error: authError, login, logout, refresh } = useAuth();
  const [email, setEmail] = useState('admin@retro.com');
  const [password, setPassword] = useState('');
  const [loginPending, setLoginPending] = useState(false);
  const [productForm, setProductForm] = useState(blankProduct);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | number | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase || user?.role !== 'admin') return;
    setDataLoading(true);
    setDataError('');
    const [productsResult, ordersResult] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, price, stock, status, image_url')
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, customer_name, phone, total, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (productsResult.error || ordersResult.error) {
      setDataError(productsResult.error?.message || ordersResult.error?.message || 'Unable to load admin data.');
    } else {
      setProducts((productsResult.data || []) as ProductRow[]);
      setOrders((ordersResult.data || []) as OrderRow[]);
    }
    setDataLoading(false);
  }, [user?.role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Enter the admin email and password.');
      return;
    }
    setLoginPending(true);
    try {
      await login(email, password);
      setPassword('');
      toast.success('Signed in to the control room.');
    } catch (loginError) {
      toast.error(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoginPending(false);
    }
  };

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSavingProduct(true);
    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim(),
      description: productForm.description.trim() || null,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      sizes: productForm.sizes.split(',').map((size) => size.trim()).filter(Boolean),
      image_url: productForm.imageUrl.trim() || null,
      status: 'active',
      featured: false,
    };

    const result = await supabase.from('products').insert(payload);
    if (result.error) {
      toast.error(result.error.message);
    } else {
      toast.success('Product added to the catalog.');
      setProductForm(blankProduct);
      await loadData();
    }
    setSavingProduct(false);
  };

  const handleOrderStatus = async (order: OrderRow, status: OrderStatus) => {
    if (!supabase || status === order.status) return;
    setUpdatingOrder(order.id);
    const result = await supabase.from('orders').update({ status }).eq('id', order.id);
    if (result.error) {
      toast.error(result.error.message);
    } else {
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status,
        note: `Status updated by ${user?.email || 'admin'}`,
      });
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status } : item));
      toast.success('Order status updated.');
    }
    setUpdatingOrder(null);
  };

  if (loading) {
    return <SimpleAdminPage eyebrow="Admin access" title="Checking credentials."><p>Opening the control room.</p></SimpleAdminPage>;
  }

  if (!user) {
    return (
      <main className="container min-h-[70vh] pt-36 pb-24">
        <p className="eyebrow">Admin access</p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl leading-none md:text-8xl">Sign in to manage<span className="text-[#f7a51a]">.</span></h1>
        <p className="mt-10 max-w-xl text-lg leading-8 text-[#c5bfb3]">Use the Supabase Auth account assigned the Retro Drip administrator role.</p>
        <form onSubmit={handleLogin} className="mt-10 grid max-w-md gap-5">
          <label><span className="eyebrow mb-2 block">Admin email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          <label><span className="eyebrow mb-2 block">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
          {authError && <p className="text-sm text-[#ff9c72]">{authError.message}</p>}
          <button className="btn btn-primary w-fit" disabled={loginPending}>{loginPending ? <><Loader2 className="animate-spin" size={15}/> Signing in…</> : <>Sign in <ArrowRight size={15}/></>}</button>
        </form>
        <p className="mt-8 text-xs leading-6 text-[#77736c]">The account email is prefilled as admin@retro.com. Enter the password you created in Supabase Authentication.</p>
      </main>
    );
  }

  if (user.role !== 'admin') {
    return (
      <SimpleAdminPage eyebrow="Access denied" title="Not assigned here.">
        <p>This account is authenticated but is not marked as an administrator in public.profiles.</p>
        <button onClick={() => void logout()} className="btn btn-ghost mt-8">Sign out <LogOut size={15}/></button>
      </SimpleAdminPage>
    );
  }

  return (
    <main className="container pt-36 pb-24">
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div><p className="eyebrow">Admin workspace</p><h1 className="mt-4 font-display text-6xl md:text-8xl">Control room<span className="text-[#f7a51a]">.</span></h1></div>
        <div className="flex items-center gap-4"><p className="font-mono text-xs text-[#9a958b]">{user.email}</p><button onClick={() => void logout()} className="btn btn-ghost">Sign out <LogOut size={15}/></button></div>
      </div>

      {dataError && <div className="mt-8 border border-[#ff9c72]/40 bg-[#2a1711] p-4 text-sm text-[#ffb69a]">{dataError}</div>}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Stat label="Products" value={products.length}/>
        <Stat label="Order requests" value={orders.length}/>
        <Stat label="Payment" value="OFF" accent />
      </div>

      <div className="mt-12 flex justify-end"><button className="btn btn-ghost" onClick={() => void loadData()} disabled={dataLoading}>{dataLoading ? <Loader2 className="animate-spin" size={15}/> : <RefreshCw size={15}/>} Refresh data</button></div>

      <div className="mt-4 grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
        <section>
          <p className="eyebrow">Add product</p>
          <form onSubmit={handleCreateProduct} className="mt-5 grid gap-4">
            <AdminInput label="Name" value={productForm.name} onChange={(value) => setProductForm({ ...productForm, name: value })} required />
            <AdminInput label="Slug" value={productForm.slug} onChange={(value) => setProductForm({ ...productForm, slug: value })} required />
            <AdminInput label="Price" type="number" value={productForm.price} onChange={(value) => setProductForm({ ...productForm, price: value })} required />
            <AdminInput label="Stock" type="number" value={productForm.stock} onChange={(value) => setProductForm({ ...productForm, stock: value })} required />
            <AdminInput label="Sizes, comma separated" value={productForm.sizes} onChange={(value) => setProductForm({ ...productForm, sizes: value })} required />
            <AdminInput label="Image URL" value={productForm.imageUrl} onChange={(value) => setProductForm({ ...productForm, imageUrl: value })} />
            <label><span className="eyebrow mb-2 block">Description</span><textarea rows={4} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}/></label>
            <button disabled={savingProduct} className="btn btn-primary w-fit">{savingProduct ? <><Loader2 className="animate-spin" size={15}/> Saving…</> : <>Save product <Check size={15}/></>}</button>
          </form>
        </section>

        <section>
          <p className="eyebrow">Recent catalog</p>
          <div className="mt-5 overflow-x-auto border border-white/10"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-white/10 bg-[#11100e] font-mono text-[10px] uppercase tracking-[.12em] text-[#9a958b]"><tr><th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-b border-white/10"><td className="p-4">{product.name}</td><td className="p-4 font-mono">₹{Number(product.price).toFixed(2)}</td><td className="p-4 font-mono">{product.stock}</td><td className="p-4 text-[#f7a51a]">{product.status}</td></tr>)}</tbody></table></div>

          <p className="eyebrow mt-10">Order requests</p>
          <div className="mt-5 overflow-x-auto border border-white/10"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-white/10 bg-[#11100e] font-mono text-[10px] uppercase tracking-[.12em] text-[#9a958b]"><tr><th className="p-4">Customer</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-white/10"><td className="p-4">{order.customer_name}<br/><span className="text-xs text-[#9a958b]">{order.phone}</span></td><td className="p-4 font-mono">₹{Number(order.total).toFixed(2)}</td><td className="p-4"><select value={order.status} disabled={updatingOrder === order.id} onChange={(event) => void handleOrderStatus(order, event.target.value as OrderStatus)} className="min-w-36"><option value="pending">pending</option>{orderStatuses.filter((status) => status !== 'pending').map((status) => <option key={status} value={status}>{status}</option>)}</select></td><td className="p-4 text-xs text-[#9a958b]">{new Date(order.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return <div className="border border-white/10 bg-[#11100e] p-5"><p className="eyebrow">{label}</p><p className={`mt-3 font-display text-4xl ${accent ? 'text-[#f7a51a]' : ''}`}>{value}</p></div>;
}

function AdminInput({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span className="eyebrow mb-2 block">{label}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)}/></label>;
}

function SimpleAdminPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <main className="container min-h-[70vh] pt-36 pb-24"><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 max-w-4xl font-display text-6xl leading-none md:text-8xl">{title}<span className="text-[#f7a51a]">.</span></h1><div className="mt-12 max-w-2xl text-lg leading-8 text-[#c5bfb3]">{children}</div><Link href="/" className="btn btn-ghost mt-8">Back to the storefront <ArrowRight size={15}/></Link></main>;
}
