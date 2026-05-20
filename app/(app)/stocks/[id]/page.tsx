'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus, Package, Receipt, Percent, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getTrip, getProducts, getExpenses, deleteTrip, createProduct, uploadProductImage, createExpense, deleteProduct, deleteExpense } from '@/lib/db'
import { calculateTripStats, formatCurrency, formatPercent } from '@/lib/calculations'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StockForm } from '@/components/stocks/StockForm'
import { ProductForm } from '@/components/products/ProductForm'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { Trip, Product, Expense, TripStats, ProductWithCosts } from '@/lib/types'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<TripStats | null>(null)
  const [editing, setEditing] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [addingExpense, setAddingExpense] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, p, e] = await Promise.all([getTrip(id), getProducts(), getExpenses()])
      if (!t) { router.push('/stocks'); return }
      setTrip(t)
      setAllProducts(p)
      setAllExpenses(e)
      setStats(calculateTripStats(t, p, e))
      setLoading(false)
    }
    load()
  }, [id, router])

  function recompute(t: Trip, p: Product[], e: Expense[]) {
    setStats(calculateTripStats(t, p, e))
  }

  function handleProductSaved(saved: Product) {
    const updated = allProducts.some(p => p.id === saved.id)
      ? allProducts.map(p => p.id === saved.id ? saved : p)
      : [saved, ...allProducts]
    setAllProducts(updated)
    recompute(trip!, updated, allExpenses)
    setAddingProduct(false)
  }

  function handleExpenseSaved(saved: Expense) {
    const updated = allExpenses.some(e => e.id === saved.id)
      ? allExpenses.map(e => e.id === saved.id ? saved : e)
      : [saved, ...allExpenses]
    setAllExpenses(updated)
    recompute(trip!, allProducts, updated)
    setAddingExpense(false)
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm('Supprimer ce produit ?')) return
    await deleteProduct(productId)
    const updated = allProducts.filter(p => p.id !== productId)
    setAllProducts(updated)
    recompute(trip!, updated, allExpenses)
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await deleteExpense(expenseId)
    const updated = allExpenses.filter(e => e.id !== expenseId)
    setAllExpenses(updated)
    recompute(trip!, allProducts, updated)
  }

  function handleTripSave(saved: Trip) {
    setTrip(saved)
    recompute(saved, allProducts, allExpenses)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer le stock "${trip?.name}" ?`)) return
    await deleteTrip(id)
    router.push('/stocks')
  }

  if (loading || !trip || !stats) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const expectedRevenue = stats.products_with_costs.reduce((sum, p) => {
    const price = p.manual_price ?? p.suggested_mid
    return sum + price * p.quantity
  }, 0)
  const estimatedProfit = expectedRevenue - stats.total_invested
  const isProfit = estimatedProfit >= 0

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/stocks" className="p-2 rounded-xl hover:bg-gray-100 transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[trip.status]}`}>
              {TRIP_STATUS_LABELS[trip.status]}
            </span>
            {trip.customs_rate > 0 && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                Douane {trip.customs_rate}%
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-gray-800 truncate">{trip.name}</h1>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin size={10} /> {trip.origin} · {format(new Date(trip.date), 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-gray-100 transition">
          <Pencil size={15} className="text-gray-500" />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 transition">
          <Trash2 size={15} className="text-red-400" />
        </button>
      </div>

      {/* Financial summary */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-50">
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total investi</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_invested)}</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Achats</span>
                <span className="font-medium text-gray-600">{formatCurrency(stats.total_purchase)}</span>
              </div>
              {stats.customs_amount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-orange-400">Douane {trip.customs_rate}%</span>
                  <span className="font-medium text-orange-500">{formatCurrency(stats.customs_amount)}</span>
                </div>
              )}
              {stats.total_expenses > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-purple-400">Dépenses</span>
                  <span className="font-medium text-purple-500">{formatCurrency(stats.total_expenses)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-1">Bénéfice estimé</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(estimatedProfit)}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Revenus attendus</span>
                <span className="font-medium text-blue-600">{formatCurrency(expectedRevenue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Marge</span>
                <span className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                  {expectedRevenue > 0 ? formatPercent((estimatedProfit / expectedRevenue) * 100) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Articles</span>
                <span className="font-medium text-gray-600">{stats.unit_count} unités</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {stats.total_invested > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#C9A84C]" style={{ width: `${(stats.total_purchase / stats.total_invested) * 100}%` }} />
              {stats.customs_amount > 0 && (
                <div className="bg-orange-400" style={{ width: `${(stats.customs_amount / stats.total_invested) * 100}%` }} />
              )}
              {stats.total_expenses > 0 && (
                <div className="bg-purple-400" style={{ width: `${(stats.total_expenses / stats.total_invested) * 100}%` }} />
              )}
            </div>
            <div className="flex gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-[#C9A84C] inline-block" />Achats</span>
              {stats.customs_amount > 0 && <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Douane</span>}
              {stats.total_expenses > 0 && <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />Dépenses</span>}
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-gray-400" />
            <span className="font-semibold text-gray-800">Produits</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {stats.products.length} réf · {stats.unit_count} u
            </span>
          </div>
          <Button size="sm" onClick={() => setAddingProduct(true)}>
            <Plus size={13} /> Ajouter
          </Button>
        </div>

        {stats.products_with_costs.length === 0 ? (
          <div className="py-10 text-center">
            <Package size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun produit dans ce stock</p>
            <button
              onClick={() => setAddingProduct(true)}
              className="mt-3 text-xs text-[#C9A84C] font-medium hover:underline"
            >
              + Ajouter un produit
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.products_with_costs.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                customsRate={trip.customs_rate}
                onDelete={() => handleDeleteProduct(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-gray-400" />
            <span className="font-semibold text-gray-800">Dépenses</span>
            {stats.total_expenses > 0 && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                {formatCurrency(stats.total_expenses)}
              </span>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAddingExpense(true)}>
            <Plus size={13} /> Ajouter
          </Button>
        </div>

        {stats.expenses.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Aucune dépense liée</p>
            <button
              onClick={() => setAddingExpense(true)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
              + Transport, carburant, hébergement…
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.expenses.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between group">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.category} · {format(new Date(e.date), 'd MMM', { locale: fr })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(e.amount)}</p>
                  <button
                    onClick={() => handleDeleteExpense(e.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-50"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {trip.notes && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 px-4 py-3">
          <p className="text-xs font-medium text-amber-700 mb-0.5">Notes</p>
          <p className="text-sm text-amber-800">{trip.notes}</p>
        </div>
      )}

      {/* Modals */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le stock">
        <StockForm trip={trip} onSave={handleTripSave} onCancel={() => setEditing(false)} />
      </Modal>

      <Modal open={addingProduct} onClose={() => setAddingProduct(false)} title="Ajouter un produit">
        <ProductForm
          defaultTripId={id}
          onSave={handleProductSaved}
          onCancel={() => setAddingProduct(false)}
        />
      </Modal>

      <Modal open={addingExpense} onClose={() => setAddingExpense(false)} title="Ajouter une dépense">
        <ExpenseForm
          defaultTripId={id}
          trips={[trip]}
          onSave={handleExpenseSaved}
          onCancel={() => setAddingExpense(false)}
        />
      </Modal>
    </div>
  )
}

function ProductRow({ product, customsRate, onDelete }: { product: ProductWithCosts; customsRate: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="px-4 py-3 flex items-center gap-3 group">
        {product.image_url ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0">
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Package size={15} className="text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
          <p className="text-xs text-gray-400">
            {product.quantity} u · achat {formatCurrency(product.purchase_price)}/u
            {customsRate > 0 && ` · douane +${formatCurrency(Math.round(product.allocated_customs / product.quantity))}/u`}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-800">{formatCurrency(product.cost_per_unit)}<span className="text-xs font-normal text-gray-400">/u</span></p>
          <p className="text-xs text-[#C9A84C] font-medium">vente: {formatCurrency(product.manual_price ?? product.suggested_mid)}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mx-4 mb-3 bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Prix d'achat ({product.quantity}u)</span>
            <span className="font-medium text-gray-700">{formatCurrency(product.total_purchase_cost)}</span>
          </div>
          {product.allocated_customs > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-orange-500">Douane allouée ({customsRate}%)</span>
              <span className="font-medium text-orange-600">+ {formatCurrency(product.allocated_customs)}</span>
            </div>
          )}
          {product.allocated_expenses > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-purple-500">Dépenses allouées</span>
              <span className="font-medium text-purple-600">+ {formatCurrency(product.allocated_expenses)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
            <span className="font-semibold text-gray-700">Coût réel/unité</span>
            <span className="font-bold text-gray-900">{formatCurrency(product.cost_per_unit)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Prudent +30%', price: product.suggested_low, margin: product.margin_at_low },
              { label: 'Équilibré +50%', price: product.suggested_mid, margin: product.margin_at_mid },
              { label: 'Premium +80%', price: product.suggested_high, margin: product.margin_at_high },
            ].map(({ label, price, margin }) => (
              <div key={label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <p className="text-[10px] text-gray-400 leading-tight mb-1">{label}</p>
                <p className="text-xs font-bold text-gray-800">{formatCurrency(price)}</p>
                <p className="text-[10px] text-green-600">{formatPercent(margin)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
