'use client'
import { useEffect, useState } from 'react'
import { Plus, Receipt, TrendingDown } from 'lucide-react'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getExpenses, getTrips, deleteExpense, createTrip } from '@/lib/db'
import { formatCurrency } from '@/lib/calculations'
import type { Expense, Trip } from '@/lib/types'
import { format } from 'date-fns'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingTrip, setAddingTrip] = useState(false)
  const [tripName, setTripName] = useState('')
  const [tripDate, setTripDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    async function load() {
      const [e, t] = await Promise.all([getExpenses(), getTrips()])
      setExpenses(e)
      setTrips(t)
      setLoading(false)
    }
    load()
  }, [])

  function handleSave(saved: Expense) {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setAdding(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleAddTrip() {
    if (!tripName.trim()) return
    const trip = await createTrip({
      name: tripName.trim(),
      date: tripDate,
      customs_rate: 0,
      status: 'open',
      origin: 'Espagne',
      notes: null,
    })
    setTrips((prev) => [trip, ...prev])
    setTripName('')
    setAddingTrip(false)
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dépenses</h1>
          <p className="text-sm text-gray-400">{expenses.length} enregistrements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAddingTrip(true)}>
            + Voyage
          </Button>
          <Button size="md" onClick={() => setAdding(true)}>
            <Plus size={16} /> Ajouter
          </Button>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-orange-500" />
              <p className="text-xs text-gray-500 font-medium">Total dépenses</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(total)}</p>
          </Card>
          {topCategory && (
            <Card>
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={16} className="text-purple-500" />
                <p className="text-xs text-gray-500 font-medium">Catégorie principale</p>
              </div>
              <p className="text-base font-bold text-gray-800">{topCategory[0]}</p>
              <p className="text-xs text-gray-400">{formatCurrency(topCategory[1])}</p>
            </Card>
          )}
        </div>
      )}

      {Object.keys(byCategory).length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-800 mb-3">Par catégorie</h2>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(amt / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16">
          <Receipt size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Pas encore de dépenses. Ajoutez la première !</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseCard
              key={e.id}
              expense={e}
              onEdit={(exp) => setEditing(exp)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Ajouter une dépense">
        <ExpenseForm trips={trips} onSave={handleSave} onCancel={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Modifier la dépense">
        {editing && (
          <ExpenseForm
            expense={editing}
            trips={trips}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={addingTrip} onClose={() => setAddingTrip(false)} title="Ajouter un voyage">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nom du voyage</label>
            <input
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              placeholder="ex : Madrid — Mai 2025"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setAddingTrip(false)}>Annuler</Button>
            <Button fullWidth onClick={handleAddTrip}>Créer le voyage</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
