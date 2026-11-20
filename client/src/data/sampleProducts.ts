import { mapFakeStoreProduct, type FakeStoreProduct } from '@/lib/product'

// Placeholder rows in Fake Store shape, until a real data source is wired in.
// The last two have a missing and a broken image to show the "No image" state.
const raw: FakeStoreProduct[] = [
  { id: 1, title: 'Fjallraven Foldsack No. 1 Backpack, Fits 15 Laptops', price: 109.95, image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png', category: "men's clothing" },
  { id: 2, title: 'Mens Casual Premium Slim Fit T-Shirts', price: 22.3, image: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png', category: "men's clothing" },
  { id: 5, title: "John Hardy Women's Legends Naga Gold & Silver Dragon Station Chain Bracelet", price: 695, image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png', category: 'jewelery' },
  { id: 9, title: 'WD 2TB Elements Portable External Hard Drive - USB 3.0', price: 64, image: 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png', category: 'electronics' },
  { id: 15, title: "BIYLACLESEN Women's 3-in-1 Snowboard Jacket Winter Coats", price: 56.99, image: '', category: "women's clothing" },
  { id: 16, title: "Lock and Love Women's Removable Hooded Faux Leather Moto Biker Jacket", price: 29.95, image: 'https://broken.invalid/x.png', category: "women's clothing" },
]

export const sampleProducts = raw.map(mapFakeStoreProduct)
