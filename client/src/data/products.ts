export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  sizes: string[];
  stock: number;
  tag: string;
  image: string;
  accent: string;
};

// Preview catalog only. Production catalog reads from the products API once records exist.
export const previewProducts: Product[] = [
  { id: 1, slug: 'washed-graphic-tee', name: 'Washed Graphic Tee', category: 'T-Shirts', price: 1299, description: 'A heavyweight, faded cotton tee with a lived-in hand and underground attitude.', sizes: ['S','M','L','XL'], stock: 18, tag: 'NEW DROP', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85', accent: '#e7c17c' },
  { id: 2, slug: 'utility-denim-01', name: 'Utility Denim 01', category: 'Denim', price: 2499, description: 'Relaxed surplus-inspired denim with an easy drape and considered utility details.', sizes: ['30','32','34','36'], stock: 7, tag: 'LIMITED', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85', accent: '#86a1a8' },
  { id: 3, slug: 'signal-track-pant', name: 'Signal Track Pant', category: 'Track Pants', price: 1899, description: 'A tapered track silhouette finished with contrast piping and a soft brushed interior.', sizes: ['M','L','XL'], stock: 12, tag: 'RESTOCKED', image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=85', accent: '#b4a7d6' },
  { id: 4, slug: 'after-hours-hoodie', name: 'After Hours Hoodie', category: 'Hoodies', price: 2799, description: 'Heavy fleece, dropped shoulders, and a low-key statement for late-night city miles.', sizes: ['S','M','L','XL','XXL'], stock: 5, tag: 'LOW STOCK', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85', accent: '#cb8c55' },
  { id: 5, slug: 'archive-camp-shirt', name: 'Archive Camp Shirt', category: 'Shirts', price: 2199, description: 'A fluid printed shirt that lands somewhere between vintage archive and street uniform.', sizes: ['M','L','XL'], stock: 9, tag: 'IMPORTED', image: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=1000&q=85', accent: '#cb9b9b' },
  { id: 6, slug: 'rustline-sweatshirt', name: 'Rustline Sweatshirt', category: 'Sweatshirts', price: 2299, description: 'A washed crewneck with generous volume and a warm rust-toned finish.', sizes: ['S','M','L','XL'], stock: 14, tag: 'VINTAGE', image: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=1000&q=85', accent: '#d98b54' },
];

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
