import { Check } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Product } from '@/lib/product'

const ALL = 'all'

interface CategoryFilterProps {
  products: Product[]
  selected: string | null // null means "All"
  onChange: (category: string | null) => void
}

export function CategoryFilter({ products, selected, onChange }: CategoryFilterProps) {
  const categories = [...new Set(products.flatMap((p) => (p.category ? [p.category] : [])))]
  const value = selected ?? ALL

  return (
    <ToggleGroup
      type="single"
      value={value}
      spacing={3}
      className="flex-wrap"
      aria-label="Filter by category"
      // Radix sends "" when the active item is clicked again; keep exactly one selected.
      onValueChange={(next) => next && onChange(next === ALL ? null : next)}
    >
      {[ALL, ...categories].map((item) => (
        <ToggleGroupItem key={item} value={item}>
          {value === item && <Check aria-hidden="true" />}
          {item === ALL ? 'All' : item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
