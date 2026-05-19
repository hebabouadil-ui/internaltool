'use client'
import { useEffect, useState } from 'react'
import {
  TrendingUp,
  Package,
  Receipt,
  DollarSign,
  ShoppingBag,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { getProducts, getExpenses } from '@/lib/db'
import { calculateDashboardStats, calculateProductCosts, formatCurrency, formatPercent } from '@/lib/calculations'
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!stats || products.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bienvenue sur ImportTracker</h2>
          <p className="text-gray-500 text-sm mb-6">
            Commencez par ajouter un produit ou enregistrer une dépense.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
            >
              <Package size={16} /> Ajouter un produit
            </Link>
            <Link
              href="/expenses"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
            >
              <Receipt size={16} /> Ajouter une dépense
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const topProducts = products
    .map((p) => calculateProductCosts(p, expenses, products))
    .sort((a, b) => b.real_cost_total - a.real_cost_total)
    .slice(0, 3)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Vue d'ensemble</h1>
        <p className="text-sm text-gray-400">Votre activité en un coup d'œil</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total investi"
          value={formatCurrency(stats.total_invested)}
          icon={<DollarSign size={18} />}
          sub="Achats de produits"
          color="indigo"
        />
        <StatCard
          label="Total dépenses"
          value={formatCurrency(stats.total_expenses)}
          icon={<Receipt size={18} />}
          sub="Voyage, livraison, etc."
          color="orange"
        />
        <StatCard
          label="Revenus attendus"
          value={formatCurrency(stats.expected_revenue)}
          icon={<ShoppingBag size={18} />}
          sub="Si tout vendu"
          color="blue"
        />
        <StatCard
          label="Bénéfice estimé"
          value={formatCurrency(stats.estimated_profit)}
          icon={<TrendingUp size={18} />}
          sub={formatPercent(stats.overall_margin) + ' de marge'}
          color={stats.estimated_profit >= 0 ? 'green' : 'red'}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Inventaire</h2>
          <Link href="/products" className="text-sm text-indigo-600 flex items-center gap-1 font-medium">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-800">{stats.total_products}</p>
            <p className="text-xs text-gray-500 mt-0.5">Produits</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-600">{stats.products_in_stock}</p>
            <p className="text-xs text-blue-500 mt-0.5">En stock</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-500">{stats.products_sold}</p>
            <p className="text-xs text-gray-400 mt-0.5">Vendus</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-800">Marge bénéficiaire</h2>
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
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </Card>

      {topProducts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Meilleurs produits</h2>
            <Link href="/products" className="text-sm text-indigo-600 flex items-center gap-1 font-medium">
              Tous <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {topProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">Coût : {formatCurrency(p.cost_per_unit)}/unité</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(p.manual_price ?? p.suggested_mid)}</p>
                    <p className="text-xs text-gray-400">prix de vente</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
