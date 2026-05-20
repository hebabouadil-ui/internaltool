'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Trash2, Plus, Package, Receipt,
  TrendingUp, Percent, MapPin, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getTrip, getProducts, getExpenses, updateTrip, deleteTrip } from '@/lib/db'
import { calculateTripStats, formatCurrency, formatPercent } from '@/lib/calculations'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StockForm } from '@/components/stocks/StockForm'
import type { Trip, Product, Expense, TripStats, ProductWithCosts } from '@/lib/types'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<TripStats | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, p, e] = await Promise.all([getTrip(id), getProducts(), getExpenses()])
      if (!t) { router.push('/stocks'); return }
      setTrip(t)
      setProducts(p)
      setExpenses(e)
      setStats(calculateTripStats(t, p, e))
      setLoading(false)
    }
    load()
  }, [id, router])

  function handleTripSave(saved: Trip) {
    setTrip(saved)
    setStats(calculateTripStats(saved, products, expenses))
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer le stock "${trip?.name}" ? Les produits liés ne seront pas supprimés.`)) return
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

  const customsPerUnit = stats.unit_count > 0 ? stats.customs_amount / stats.unit_count : 0
  const avgCostPerUnit = stats.unit_count > 0 ? stats.total_invested / stats.unit_count : 0

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/stocks" className="p-2 rounded-xl hover:bg-gray-100 transition mt-0.5">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[trip.status]}`}>
              {TRIP_STATUS_LABELS[trip.status]}
            </span>
            {trip.customs_rate > 0 && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Percent size={10} /> {trip.customs_rate}% douane
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight">{trip.name}</h1>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin size={11} />
            {trip.origin} · {format(new Date(trip.date), 'd MMMM yyyy', { locale: fr })}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <Pencil size={15} className="text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl hover:bg-red-50 transition"
          >
            <Trash2 size={15} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Cost summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Récapitulatif des coûts</h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Achats produits</span>
            <span className="text-sm font-semibold text-gray-800">{formatCurrency(stats.total_purchase)}</span>
          </div>

          {trip.customs_rate > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500">Frais de douane</span>
                <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                  {trip.customs_rate}%
                </span>
              </div>
              <span className="text-sm font-semibold text-orange-600">{formatCurrency(stats.customs_amount)}</span>
            </div>
          )}

          {stats.total_expenses > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Dépenses liées</span>
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(stats.total_expenses)}</span>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">Total investi</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.total_invested)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Articles</p>
            <p className="text-base font-bold text-gray-800">{stats.unit_count}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Douane/unité</p>
            <p className="text-base font-bold text-orange-600">
              {customsPerUnit > 0 ? formatCurrency(customsPerUnit) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Coût moy./unité</p>
            <p className="text-base font-bold text-gray-800">{formatCurrency(avgCostPerUnit)}</p>
          </div>
        </div>

        {/* Customs breakdown bar */}
        {trip.customs_rate > 0 && stats.total_invested > 0 && (
          <div className="mt-4">
            <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#C9A84C] rounded-l-full"
                style={{ width: `${(stats.total_purchase / stats.total_invested) * 100}%` }}
              />
              <div
                className="bg-orange-400"
                style={{ width: `${(stats.customs_amount / stats.total_invested) * 100}%` }}
              />
              {stats.total_expenses > 0 && (
                <div
                  className="bg-purple-400 rounded-r-full"
                  style={{ width: `${(stats.total_expenses / stats.total_invested) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <span className="text-xs text-gray-400">Achats {formatPercent((stats.total_purchase / stats.total_invested) * 100)}</span>
              </div>
              {stats.customs_amount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-xs text-gray-400">Douane {formatPercent((stats.customs_amount / stats.total_invested) * 100)}</span>
                </div>
              )}
              {stats.total_expenses > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-xs text-gray-400">Dépenses {formatPercent((stats.total_expenses / stats.total_invested) * 100)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Products in this stock */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            Produits ({stats.products.length})
          </h2>
          <Link href={`/products?stock=${id}`}>
            <Button size="sm" variant="secondary">
              <Plus size={14} /> Ajouter
            </Button>
          </Link>
        </div>

        {stats.products_with_costs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <Package size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun produit dans ce stock</p>
            <p className="text-xs text-gray-300 mt-1">Ajoutez des produits et liez-les à ce stock</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.products_with_costs.map((p) => (
              <ProductRow key={p.id} product={p} customsRate={trip.customs_rate} />
            ))}
          </div>
        )}
      </div>

      {/* Expenses linked to this stock */}
      {stats.expenses.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Receipt size={16} className="text-gray-400" />
            Dépenses liées ({stats.expenses.length})
          </h2>
          <div className="space-y-2">
            {stats.expenses.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.category} · {format(new Date(e.date), 'd MMM yyyy', { locale: fr })}</p>
                </div>
                <p className="text-sm font-bold text-gray-800">{formatCurrency(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {trip.notes && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <p className="text-xs font-medium text-amber-700 mb-1">Notes</p>
          <p className="text-sm text-amber-800">{trip.notes}</p>
        </div>
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Modifier le stock">
        <StockForm trip={trip} onSave={handleTripSave} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  )
}

function ProductRow({ product, customsRate }: { product: ProductWithCosts; customsRate: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {product.image_url ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
          <p className="text-xs text-gray-400">{product.quantity} unité{product.quantity !== 1 ? 's' : ''} · {formatCurrency(product.purchase_price)}/u achat</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-800">{formatCurrency(product.cost_per_unit)}<span className="text-xs font-normal text-gray-400">/u</span></p>
          <p className="text-xs text-gray-400">coût réel</p>
        </div>

        <ChevronRight
          size={14}
          className={`text-gray-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3">
          {/* Cost breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Prix d'achat total</span>
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
            <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
              <span className="font-semibold text-gray-700">Coût total réel</span>
              <span className="font-bold text-gray-800">{formatCurrency(product.real_cost_total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700">Coût par unité</span>
              <span className="font-bold text-[#C9A84C]">{formatCurrency(product.cost_per_unit)}</span>
            </div>
          </div>

          {/* Suggested prices */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Prix suggérés</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Prudent', price: product.suggested_low, margin: product.margin_at_low, color: 'text-blue-600' },
                { label: 'Équilibré', price: product.suggested_mid, margin: product.margin_at_mid, color: 'text-[#C9A84C]' },
                { label: 'Premium', price: product.suggested_high, margin: product.margin_at_high, color: 'text-green-600' },
              ].map(({ label, price, margin, color }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{formatCurrency(price)}</p>
                  <p className="text-xs text-gray-400">{formatPercent(margin)}</p>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/products/${product.id}`}>
            <button className="w-full mt-1 text-xs text-[#C9A84C] font-medium flex items-center justify-center gap-1 py-2 rounded-xl hover:bg-[#C9A84C]/5 transition">
              Voir le détail complet <ChevronRight size={12} />
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
