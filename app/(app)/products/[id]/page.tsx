'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Pencil, Trash2, Package,
  TrendingUp, DollarSign, Tag
} from 'lucide-react'
import { ProductForm } from '@/components/products/ProductForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { getProduct, getProducts, getExpenses, deleteProduct, updateProduct } from '@/lib/db'
import { calculateProductCosts, formatCurrency, formatPercent } from '@/lib/calculations'
import type { Product, Expense, ProductWithCosts } from '@/lib/types'

const statusConfig = {
  in_stock: { label: 'En stock', variant: 'blue' as const },
  ready: { label: 'Prêt', variant: 'green' as const },
  sold: { label: 'Vendu', variant: 'gray' as const },
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<ProductWithCosts | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customPrice, setCustomPrice] = useState('')

  useEffect(() => {
    async function load() {
      const [p, all, e] = await Promise.all([
        getProduct(id),
        getProducts(),
        getExpenses(),
      ])
      if (!p) { router.push('/products'); return }
      setAllProducts(all)
      setExpenses(e)
      const withCosts = calculateProductCosts(p, e, all)
      setProduct(withCosts)
      setCustomPrice(String(p.manual_price ?? ''))
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleDelete() {
    if (!confirm('Supprimer ce produit ?')) return
    await deleteProduct(id)
    router.push('/products')
  }

  async function handleSaveCustomPrice() {
    if (!product) return
    const price = parseFloat(customPrice)
    const updated = await updateProduct(id, { manual_price: isNaN(price) || price <= 0 ? null : price })
    const withCosts = calculateProductCosts(updated, expenses, allProducts)
    setProduct(withCosts)
  }

  function handleSave(saved: Product) {
    const updatedAll = allProducts.map((p) => (p.id === saved.id ? saved : p))
    setAllProducts(updatedAll)
    const withCosts = calculateProductCosts(saved, expenses, updatedAll)
    setProduct(withCosts)
    setEditing(false)
  }

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const status = statusConfig[product.stock_status]
  const displayPrice = product.manual_price ?? product.suggested_mid

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={18} /> Retour
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Modifier
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <Package size={28} className="text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {product.category && (
              <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
            )}
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-400">Qté</p>
                <p className="text-sm font-semibold text-gray-700">{product.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Prix d'achat</p>
                <p className="text-sm font-semibold text-gray-700">{formatCurrency(product.purchase_price)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-indigo-500" /> Détail des coûts
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Achat total</span>
            <span className="font-medium text-gray-800">{formatCurrency(product.total_purchase_cost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Part des dépenses</span>
            <span className="font-medium text-orange-600">{formatCurrency(product.allocated_expenses)}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-800">Coût total réel</span>
            <span className="font-bold text-gray-800">{formatCurrency(product.real_cost_total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-800">Coût par unité</span>
            <span className="font-bold text-indigo-600">{formatCurrency(product.cost_per_unit)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Tag size={16} className="text-indigo-500" /> Prix de vente suggérés
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Prudent', price: product.suggested_low, margin: 30, color: 'bg-yellow-50 border-yellow-200' },
            { label: 'Équilibré', price: product.suggested_mid, margin: 50, color: 'bg-blue-50 border-blue-200' },
            { label: 'Premium', price: product.suggested_high, margin: 80, color: 'bg-green-50 border-green-200' },
          ].map(({ label, price, margin, color }) => (
            <div key={label} className={`rounded-xl p-3 border text-center ${color}`}>
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="text-base font-bold text-gray-800">{formatCurrency(price)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{margin}% marge</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500" /> Calculateur de bénéfice
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min="0"
            step="1"
            placeholder={`Suggéré : ${Math.round(product.suggested_mid)}`}
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <Button size="sm" onClick={handleSaveCustomPrice}>Sauvegarder</Button>
        </div>

        {(() => {
          const price = parseFloat(customPrice) || displayPrice
          const profitUnit = price - product.cost_per_unit
          const profitTotal = profitUnit * product.quantity
          const margin = price > 0 ? (profitUnit / price) * 100 : 0
          const isPos = profitUnit >= 0

          return (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bénéfice par unité</span>
                <span className={`font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(profitUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bénéfice total ({product.quantity} unités)</span>
                <span className={`font-bold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(profitTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Marge</span>
                <span className={`font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                  {formatPercent(margin)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${isPos ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(Math.max(margin, 0), 100)}%` }}
                />
              </div>
            </div>
          )
        })()}
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le produit">
        <ProductForm product={product} onSave={handleSave} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  )
}
