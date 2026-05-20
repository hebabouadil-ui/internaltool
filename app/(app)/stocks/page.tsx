'use client'
import { useEffect, useState } from 'react'
import { Plus, Package, MapPin, Percent, ChevronRight, Boxes } from 'lucide-react'
import Link from 'next/link'
import { getTrips, getProducts, getExpenses, deleteTrip } from '@/lib/db'
import { calculateTripStats, formatCurrency, formatPercent } from '@/lib/calculations'
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
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setAdding(false)
  }

  const tripStats: TripStats[] = trips.map((t) => calculateTripStats(t, products, expenses))

  const totalInvested = tripStats.reduce((sum, s) => sum + s.total_invested, 0)
  const totalCustoms = tripStats.reduce((sum, s) => sum + s.customs_amount, 0)
  const totalUnits = tripStats.reduce((sum, s) => sum + s.unit_count, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Stocks</h1>
          <p className="text-sm text-gray-400">{trips.length} voyage{trips.length !== 1 ? 's' : ''} · {totalUnits} articles</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} /> Nouveau stock
        </Button>
      </div>

      {trips.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Total investi</p>
            <p className="text-base font-bold text-gray-800">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Frais douane</p>
            <p className="text-base font-bold text-orange-600">{formatCurrency(totalCustoms)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Articles</p>
            <p className="text-base font-bold text-gray-800">{totalUnits}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <Boxes size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">Pas encore de stocks</p>
          <p className="text-gray-300 text-xs">Créez un stock pour chaque voyage d'achat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tripStats.map((s) => (
            <Link key={s.trip.id} href={`/stocks/${s.trip.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#C9A84C]/40 hover:shadow-sm transition cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TRIP_STATUS_COLORS[s.trip.status]}`}>
                        {TRIP_STATUS_LABELS[s.trip.status]}
                      </span>
                      {s.trip.customs_rate > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Percent size={10} />
                          {s.trip.customs_rate}% douane
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 truncate">{s.trip.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin size={11} />
                      {s.trip.origin} · {format(new Date(s.trip.date), 'd MMM yyyy', { locale: fr })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400">Produits</p>
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                      <Package size={12} className="text-gray-400" />
                      {s.products.length} ref · {s.unit_count} u
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Douane</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {s.customs_amount > 0 ? formatCurrency(s.customs_amount) : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total investi</p>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(s.total_invested)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nouveau stock">
        <StockForm onSave={handleSave} onCancel={() => setAdding(false)} />
      </Modal>
    </div>
  )
}
