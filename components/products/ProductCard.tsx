'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { ProductWithCosts } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { getInitials, getCreatorColor } from '@/lib/auth'

const statusConfig = {
  in_stock: { label: 'En stock', variant: 'blue' as const },
  ready: { label: 'Prêt', variant: 'green' as const },
  sold: { label: 'Vendu', variant: 'gray' as const },
}

export function ProductCard({ product }: { product: ProductWithCosts }) {
  const router = useRouter()
  const status = statusConfig[product.stock_status]
  const displayPrice = product.manual_price ?? product.suggested_mid
  const creatorName = product.creator_name ?? 'Admin'

  return (
    <Card onClick={() => router.push(`/products/${product.id}`)}>
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={24} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight truncate">
              {product.name}
            </h3>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${getCreatorColor(creatorName)}`}>
              {getInitials(creatorName)}
            </div>
            <p className="text-xs text-gray-400">Qté : {product.quantity}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Coût/unité</p>
              <p className="text-sm font-semibold text-gray-700">
                {formatCurrency(product.cost_per_unit)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Vendre à</p>
              <p className="text-sm font-bold text-indigo-600">
                {formatCurrency(displayPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
