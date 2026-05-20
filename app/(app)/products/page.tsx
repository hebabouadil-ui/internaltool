'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductForm } from '@/components/products/ProductForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getProducts, getExpenses, getTrips } from '@/lib/db'
import { calculateProductCosts } from '@/lib/calculations'
import type { Product, Expense, Trip, ProductWithCosts } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, e, t] = await Promise.all([getProducts(), getExpenses(), getTrips()])
      setProducts(p)
      setExpenses(e)
      setTrips(t)
      setLoading(false)
    }
    load()
  }, [])

  function handleSave(saved: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setAdding(false)
  }

  const productsWithCosts: ProductWithCosts[] = products.map((p) =>
    calculateProductCosts(p, expenses, products)
  )

  const filtered = productsWithCosts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Produits</h1>
          <p className="text-sm text-gray-400">{products.length} articles suivis</p>
        </div>
        <Button onClick={() => setAdding(true)} size="md">
          <Plus size={16} /> Ajouter
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? 'Aucun produit ne correspond à votre recherche' : 'Pas encore de produits. Ajoutez le premier !'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Ajouter un produit">
        <ProductForm trips={trips} onSave={handleSave} onCancel={() => setAdding(false)} />
      </Modal>
    </div>
  )
}
