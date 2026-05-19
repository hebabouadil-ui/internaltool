'use client'
import { Trash2, Pencil } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { Expense } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'
import { format } from 'date-fns'

const categoryColors: Record<string, 'blue' | 'orange' | 'purple' | 'green' | 'yellow' | 'red' | 'gray'> = {
  Transport: 'blue',
  Fuel: 'orange',
  Shipping: 'purple',
  Customs: 'red',
  Packaging: 'green',
  Food: 'yellow',
  Accommodation: 'blue',
  Other: 'gray',
}

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const color = categoryColors[expense.category] ?? 'gray'

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-800 text-sm truncate">{expense.name}</p>
            <Badge variant={color}>{expense.category}</Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(new Date(expense.date), 'dd MMM yyyy')}
          </p>
          {expense.note && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{expense.note}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <p className="font-bold text-gray-800 text-sm">{formatCurrency(expense.amount)}</p>
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  )
}
