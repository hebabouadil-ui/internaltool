'use client'
import { useState } from 'react'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { createExpense, updateExpense } from '@/lib/db'
import type { Expense, Trip } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/lib/types'
import { format } from 'date-fns'

interface ExpenseFormProps {
  expense?: Expense
  trips: Trip[]
  onSave: (expense: Expense) => void
  onCancel: () => void
}

const categoryOptions = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))

export function ExpenseForm({ expense, trips, onSave, onCancel }: ExpenseFormProps) {
  const [name, setName] = useState(expense?.name ?? '')
  const [amount, setAmount] = useState(String(expense?.amount ?? ''))
  const [date, setDate] = useState(expense?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [category, setCategory] = useState(expense?.category ?? 'Other')
  const [note, setNote] = useState(expense?.note ?? '')
  const [tripId, setTripId] = useState(expense?.trip_id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tripOptions = [
    { value: '', label: 'No trip / General' },
    ...trips.map((t) => ({ value: t.id, label: t.name })),
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Expense name is required')
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return setError('Enter a valid amount')

    setLoading(true)
    setError('')

    try {
      const payload = {
        name: name.trim(),
        amount: amt,
        date,
        category,
        note: note.trim() || null,
        trip_id: tripId || null,
      }

      let saved: Expense
      if (expense) {
        saved = await updateExpense(expense.id, payload)
      } else {
        saved = await createExpense(payload)
      }
      onSave(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Expense name *"
        placeholder="e.g. Gas — Madrid trip"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Amount *"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          suffix="MAD"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Date *"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <Select
        label="Link to trip (optional)"
        options={tripOptions}
        value={tripId}
        onChange={(e) => setTripId(e.target.value)}
      />

      <Input
        label="Note (optional)"
        placeholder="Additional details..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {expense ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
