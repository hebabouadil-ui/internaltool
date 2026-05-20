'use client'
import { useEffect, useState } from 'react'
import { Package, Receipt, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { getProducts, getExpenses } from '@/lib/db'
import { calculateDashboardStats, calculateProductCosts, formatCurrency, formatPercent } from '@/lib/calculations'
import { getInitials, getCreatorColor } from '@/lib/auth'
import type { Product, Expense, DashboardStats } from '@/lib/types'

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [p, e] = await Promise.all([getProducts(), getExpenses()])
        setProducts(p)
        setExpenses(e)
        setStats(calculateDashboardStats(p, e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats || products.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bienvenue sur ImportTracker</h2>
          <p className="text-gray-500 text-sm mb-6">
            Commencez par ajouter un produit ou enregistrer une dépense.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/products" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition">
              <Package size={16} /> Ajouter un produit
            </Link>
            <Link href="/expenses" className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition">
              <Receipt size={16} /> Ajouter une dépense
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isProfit = stats.estimated_profit >= 0
  const topProducts = products
    .map((p) => calculateProductCosts(p, expenses, products))
    .sort((a, b) => b.real_cost_total - a.real_cost_total)
    .slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">

      {/* Total investi — main card */}
      <Card>
        <p className="text-xs font-medium text-gray-400 mb-1">Total investi</p>
        <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.total_invested)}</p>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400">Produits</p>
            <p className="text-sm font-semibold text-gray-700">{formatCurrency(stats.total_products_cost)}</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400">Dépenses</p>
            <p className="text-sm font-semibold text-orange-600">{formatCurrency(stats.total_expenses)}</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400">Articles</p>
            <p className="text-sm font-semibold text-gray-700">{stats.total_products} produits</p>
          </div>
        </div>
      </Card>

      {/* Revenue + Profit */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-400 font-medium">Revenus attendus</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(stats.expected_revenue)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Si tout vendu</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 font-medium">Bénéfice estimé</p>
          <p className={`text-xl font-bold mt-1 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(stats.estimated_profit)}
          </p>
          <p className={`text-xs mt-0.5 ${isProfit ? 'text-green-500' : 'text-red-400'}`}>
            {formatPercent(stats.overall_margin)} de marge
          </p>
        </Card>
      </div>

      {/* Margin bar */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-700">Marge bénéficiaire</p>
          <span className={`text-lg font-bold ${stats.overall_margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatPercent(stats.overall_margin)}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${stats.overall_margin >= 50 ? 'bg-green-500' : stats.overall_margin >= 25 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${Math.min(Math.max(stats.overall_margin, 0), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-300 mt-1">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </Card>

      {/* Products list */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">Produits</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="text-blue-500 font-medium">{stats.products_in_stock} en stock</span>
            <span>{stats.products_sold} vendus</span>
            <Link href="/products" className="text-indigo-600 font-medium flex items-center gap-0.5">
              Tous <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <div className="space-y-0">
          {topProducts.map((p) => {
            const creatorName = p.creator_name ?? 'Admin'
            return (
              <Link key={p.id} href={`/products/${p.id}`}>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getCreatorColor(creatorName)}`}>
                      {getInitials(creatorName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">Coût : {formatCurrency(p.cost_per_unit)}/u · Qté {p.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-indigo-600 shrink-0 ml-2">
                    {formatCurrency(p.manual_price ?? p.suggested_mid)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </Card>

    </div>
  )
}
