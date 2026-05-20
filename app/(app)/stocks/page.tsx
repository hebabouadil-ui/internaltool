'use client'
import { useEffect, useState } from 'react'
import { Plus, Package, MapPin, Boxes, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getTrips, getProducts, getExpenses } from '@/lib/db'
import { calculateTripStats, formatCurrency } from '@/lib/calculations'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StockForm } from '@/components/stocks/StockForm'
import type { Trip, Product, Expense, TripStats } from '@/lib/types'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function StocksPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrips(), getProducts(), getExpenses()]).then(([t, p, e]) => {
      setTrips(t)
      setProducts(p)
      setExpenses(e)
      setLoading(false)
    })
  }, [])

  function handleSave(saved: Trip) {
    setTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    setAdding(false)
  }

  const tripStats: TripStats[] = trips.map((t) => calculateTripStats(t, products, expenses))
  const totalInvested = tripStats.reduce((sum, s) => sum + s.total_invested, 0)
  const totalUnits = tripStats.reduce((sum, s) => sum + s.unit_count, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-20 space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Arrivages</h1>
          <p className="text-sm text-gray-400">{trips.length} stock{trips.length !== 1 ? 's' : ''} · {totalUnits} articles au total</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} /> Nouveau stock
        </Button>
      </div>

      {trips.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Total investi</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Articles total</p>
            <p className="text-lg font-bold text-gray-800">{totalUnits} unités</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Boxes size={32} className="text-[#C9A84C]" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Pas encore d'arrivage</p>
          <p className="text-gray-400 text-sm mb-5">Créez un stock pour chaque voyage d'achat et suivez vos produits, frais et bénéfices.</p>
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} /> Créer le premier stock
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tripStats.map((s) => {
            const expectedRevenue = s.products_with_costs.reduce((sum, p) => {
              return sum + (p.manual_price ?? p.suggested_mid) * p.quantity
            }, 0)
            const profit = expectedRevenue - s.total_invested
            const isProfit = profit >= 0

            return (
              <Link key={s.trip.id} href={`/stocks/${s.trip.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#C9A84C]/40 hover:shadow-sm transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[s.trip.status]}`}>
                          {TRIP_STATUS_LABELS[s.trip.status]}
                        </span>
                        {s.trip.customs_rate > 0 && (
                          <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                            Douane {s.trip.customs_rate}%
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800">{s.trip.name}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {s.trip.origin} · {format(new Date(s.trip.date), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Produits</p>
                      <p className="text-sm font-bold text-gray-700">{s.products.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Unités</p>
                      <p className="text-sm font-bold text-gray-700">{s.unit_count}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Investi</p>
                      <p className="text-sm font-bold text-gray-700">{formatCurrency(s.total_invested)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-0.5">Bénéfice</p>
                      <p className={`text-sm font-bold ${s.products.length > 0 ? (isProfit ? 'text-green-600' : 'text-red-500') : 'text-gray-300'}`}>
                        {s.products.length > 0 ? formatCurrency(profit) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nouveau stock">
        <StockForm onSave={handleSave} onCancel={() => setAdding(false)} />
      </Modal>
    </div>
  )
}
