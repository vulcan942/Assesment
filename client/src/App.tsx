import { useState } from 'react'
import { CategoryFilter } from '@/components/CategoryFilter'
import { EnquiryForm } from '@/components/EnquiryForm'
import { ProductGrid } from '@/components/ProductGrid'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sampleProducts } from '@/data/sampleProducts'
import type { Product } from '@/lib/product'
import { sendEnquiry } from '@/lib/sendEnquiry'

export default function App() {
  const [category, setCategory] = useState<string | null>(null)
  const [enquiring, setEnquiring] = useState<Product | null>(null)

  const visible = category ? sampleProducts.filter((p) => p.category === category) : sampleProducts

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-6 min-[960px]:gap-12 min-[960px]:py-16">
      <h1 className="text-[28px] leading-9 font-bold tracking-tight">All products</h1>
      <CategoryFilter products={sampleProducts} selected={category} onChange={setCategory} />
      <ProductGrid products={visible} status="ready" onEnquire={setEnquiring} />

      <Dialog open={enquiring !== null} onOpenChange={(open) => !open && setEnquiring(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send an enquiry</DialogTitle>
            <DialogDescription>Tell us what you would like to know.</DialogDescription>
          </DialogHeader>
          {enquiring && (
            <EnquiryForm
              product={enquiring}
              onSubmit={sendEnquiry}
              onDone={() => setEnquiring(null)}
              onCancel={() => setEnquiring(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
