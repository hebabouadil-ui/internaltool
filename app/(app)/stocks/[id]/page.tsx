'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus, Package, Receipt, MapPin, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getTrip, getProducts, getExpenses, deleteTrip, deleteProduct, deleteExpense } from '@/lib/db'
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
    return sum + (p.manual_price ?? p.suggested_mid) * p.quantity
  }, 0)
  const estimatedProfit = expectedRevenue - stats.total_invested
  const isProfit = estimatedProfit >= 0
  const margin = expectedRevenue > 0 ? (estimatedProfit / expectedRevenue) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/stocks" className="p-2 rounded-xl hover:bg-gray-100 transition flex-shrink-0">
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
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl hover:bg-gray-100 transition flex-shrink-0">
          <Pencil size={15} className="text-gray-500" />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-50 transition flex-shrink-0">
          <Trash2 size={15} className="text-red-400" />
        </button>
      </div>

      {/* Main financial summary */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-50">
          {/* Coûts */}
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-2">Total investi</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_invested)}</p>
            <div className="mt-3 space-y-1.5">
              <CostLine label="Achats produits" value={stats.total_purchase} color="text-gray-600" />
              {stats.customs_amount > 0 && (
                <CostLine
                  label={`Douane (${trip.customs_rate}%)`}
                  value={stats.customs_amount}
                  color="text-orange-500"
                  highlight
                />
              )}
              {stats.total_expenses > 0 && (
                <CostLine label="Dépenses" value={stats.total_expenses} color="text-purple-500" />
              )}
            </div>
          </div>

          {/* Bénéfice */}
          <div className="p-4">
            <p className="text-xs text-gray-400 mb-2">Bénéfice estimé</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(estimatedProfit)}
            </p>
            <div className="mt-3 space-y-1.5">
              <CostLine label="Revenus attendus" value={expectedRevenue} color="text-blue-600" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Marge nette</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isProfit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {formatPercent(margin)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Articles</span>
                <span className="text-xs font-semibold text-gray-600">{stats.unit_count} unités</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customs impact banner */}
        {trip.customs_rate > 0 && stats.customs_amount > 0 && (
          <div className="border-t border-orange-50 bg-orange-50/50 px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-orange-600">
              Les frais de douane ({trip.customs_rate}%) représentent <strong>{formatPercent((stats.customs_amount / stats.total_invested) * 100)}</strong> de votre investissement total
            </p>
            <span className="text-xs font-bold text-orange-600 ml-3 flex-shrink-0">{formatCurrency(stats.customs_amount)}</span>
          </div>
        )}

        {/* Color bar */}
        {stats.total_invested > 0 && (
          <div className="flex h-1">
            <div className="bg-[#C9A84C]" style={{ width: `${(stats.total_purchase / stats.total_invested) * 100}%` }} />
            {stats.customs_amount > 0 && <div className="bg-orange-400" style={{ width: `${(stats.customs_amount / stats.total_invested) * 100}%` }} />}
            {stats.total_expenses > 0 && <div className="bg-purple-400" style={{ width: `${(stats.total_expenses / stats.total_invested) * 100}%` }} />}
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
            <button onClick={() => setAddingProduct(true)} className="mt-3 text-xs text-[#C9A84C] font-medium hover:underline">
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
            <span className="font-semibold text-gray-800">Dépenses liées</span>
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
            <p className="text-sm text-gray-400">Aucune dépense liée à ce stock</p>
            <button onClick={() => setAddingExpense(true)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 hover:underline">
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
                  <button onClick={() => handleDeleteExpense(e.id)} className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trip.notes && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 px-4 py-3">
          <p className="text-xs font-medium text-amber-700 mb-0.5">Notes</p>
          <p className="text-sm text-amber-800">{trip.notes}</p>
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le stock">
        <StockForm trip={trip} onSave={handleTripSave} onCancel={() => setEditing(false)} />
      </Modal>

      <Modal open={addingProduct} onClose={() => setAddingProduct(false)} title="Ajouter un produit">
        <ProductForm defaultTripId={id} onSave={handleProductSaved} onCancel={() => setAddingProduct(false)} />
      </Modal>

      <Modal open={addingExpense} onClose={() => setAddingExpense(false)} title="Ajouter une dépense">
        <ExpenseForm defaultTripId={id} trips={[trip]} onSave={handleExpenseSaved} onCancel={() => setAddingExpense(false)} />
      </Modal>
    </div>
  )
}

function CostLine({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${highlight ? 'bg-orange-50 -mx-2 px-2 py-0.5 rounded-lg' : ''}`}>
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{formatCurrency(value)}</span>
    </div>
  )
}

function ProductRow({ product, customsRate, onDelete }: { product: ProductWithCosts; customsRate: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [customPrice, setCustomPrice] = useState('')

  const customPriceNum = parseFloat(customPrice)
  const customProfit = !isNaN(customPriceNum) && customPriceNum > 0 ? customPriceNum - product.cost_per_unit : null
  const customMargin = customProfit !== null && customPriceNum > 0 ? (customProfit / customPriceNum) * 100 : null

  const salePrice = product.manual_price ?? product.suggested_mid
  const profitPerUnit = salePrice - product.cost_per_unit
  const totalProfit = profitPerUnit * product.quantity

  return (
    <div>
      {/* Main row */}
      <div className="px-4 py-3 group">
        <div className="flex items-start gap-3">
          {product.image_url ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden relative flex-shrink-0 mt-0.5">
              <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package size={16} className="text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setExpanded(v => !v)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                  {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-0.5">
              {product.quantity} unité{product.quantity !== 1 ? 's' : ''}
              {' · '}achat <span className="font-medium text-gray-600">{formatCurrency(product.purchase_price)}/u</span>
              {customsRate > 0 && (
                <span className="text-orange-500"> + douane <span className="font-medium">{formatCurrency(Math.round(product.allocated_customs / product.quantity))}/u</span></span>
              )}
            </p>

            {/* Coût réel + prix de vente */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Coût réel: {formatCurrency(product.cost_per_unit)}/u
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <TrendingUp size={10} />
                +{formatCurrency(totalProfit)} total
              </span>
            </div>
          </div>
        </div>

        {/* Prix suggérés — toujours visibles */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[
            { label: 'Prudent +30%', price: product.suggested_low, margin: product.margin_at_low, color: 'border-blue-100 bg-blue-50', textColor: 'text-blue-700' },
            { label: 'Équilibré +50%', price: product.suggested_mid, margin: product.margin_at_mid, color: 'border-[#C9A84C]/30 bg-[#C9A84C]/5', textColor: 'text-[#A67C32]' },
            { label: 'Premium +80%', price: product.suggested_high, margin: product.margin_at_high, color: 'border-green-100 bg-green-50', textColor: 'text-green-700' },
          ].map(({ label, price, margin, color, textColor }) => (
            <div key={label} className={`rounded-xl border p-2 text-center ${color}`}>
              <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
              <p className={`text-sm font-bold ${textColor}`}>{formatCurrency(price)}</p>
              <p className={`text-[10px] font-semibold ${textColor}`}>{formatPercent(margin)} marge</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded: cost breakdown + custom price calc */}
      {expanded && (
        <div className="mx-4 mb-3 space-y-3">
          {/* Cost breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 mb-2">Décomposition du coût</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Prix d'achat × {product.quantity}</span>
              <span className="font-medium text-gray-700">{formatCurrency(product.total_purchase_cost)}</span>
            </div>
            {product.allocated_customs > 0 && (
              <div className="flex justify-between text-xs bg-orange-50 -mx-1 px-1 py-0.5 rounded">
                <span className="text-orange-600">Douane {customsRate}% allouée</span>
                <span className="font-semibold text-orange-600">+ {formatCurrency(product.allocated_customs)}</span>
              </div>
            )}
            {product.allocated_expenses > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-purple-500">Dépenses allouées</span>
                <span className="font-medium text-purple-600">+ {formatCurrency(product.allocated_expenses)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-xs">
              <span className="font-bold text-gray-700">Coût réel / unité</span>
              <span className="font-bold text-gray-900">{formatCurrency(product.cost_per_unit)}</span>
            </div>
          </div>

          {/* Custom price calculator */}
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Calculateur de prix</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={`ex: ${Math.round(product.suggested_mid)}`}
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/20"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">MAD</span>
              </div>
              {customProfit !== null && (
                <div className={`flex-shrink-0 text-center px-3 py-2 rounded-lg ${customProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-bold ${customProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {customProfit >= 0 ? '+' : ''}{formatCurrency(customProfit)}
                  </p>
                  <p className={`text-[10px] font-medium ${customProfit >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {formatPercent(customMargin!)} marge
                  </p>
                </div>
              )}
            </div>
            {customProfit !== null && (
              <p className="text-xs text-gray-400 mt-1.5">
                Sur {product.quantity} unités: {customProfit >= 0 ? '+' : ''}{formatCurrency(customProfit * product.quantity)} de bénéfice total
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
