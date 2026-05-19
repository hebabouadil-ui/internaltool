import { ReactNode } from 'react'
import { Card } from '../ui/Card'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  sub?: string
  color?: 'indigo' | 'green' | 'orange' | 'red' | 'blue' | 'purple'
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function StatCard({ label, value, icon, sub, color = 'indigo' }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color]} shrink-0 ml-3`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
