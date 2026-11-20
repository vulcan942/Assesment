// The only product shape components accept. A new data source needs only another mapper.
export interface Product {
  id: string | number
  title: string
  price?: number
  image?: string
  category?: string
}

// Fake Store API product fields we read; description and rating are ignored for now.
export interface FakeStoreProduct {
  id: number
  title: string
  price: number
  image: string
  category: string
}

export function mapFakeStoreProduct(source: FakeStoreProduct): Product {
  return {
    id: source.id,
    title: source.title,
    price: source.price,
    image: source.image,
    category: source.category,
  }
}
