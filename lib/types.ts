export type StockStatus = 'in_stock' | 'ready' | 'sold'
export type TripStatus = 'open' | 'arrived' | 'closed'

export interface Product {
  id: string
  name: string
  image_url: string | null
  purchase_price: number
  quantity: number
  category: string | null
  stock_status: StockStatus
  manual_price: number | null
  trip_id: string | null
  created_by: string | null
  creator_name: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  name: string
  amount: number
  date: string
  category: string
  note: string | null
  trip_id: string | null
  created_by: string | null
  creator_name: string | null
  created_at: string
}

export interface Trip {
  id: string
  name: string
  date: string
  customs_rate: number
  status: TripStatus
  origin: string
  notes: string | null
  created_at: string
}

export interface ProductWithCosts extends Product {
  total_purchase_cost: number
  allocated_expenses: number
  allocated_customs: number
  real_cost_total: number
  cost_per_unit: number
  suggested_low: number
  suggested_mid: number
  suggested_high: number
  profit_at_low: number
  profit_at_mid: number
  profit_at_high: number
  margin_at_low: number
  margin_at_mid: number
  margin_at_high: number
}

export interface DashboardStats {
  total_invested: number
  total_products_cost: number
  total_expenses: number
  total_customs: number
  expected_revenue: number
  estimated_profit: number
  overall_margin: number
  total_products: number
  products_in_stock: number
  products_sold: number
}

export interface TripStats {
  trip: Trip
  products: Product[]
  expenses: Expense[]
  total_purchase: number
  customs_amount: number
  total_expenses: number
  total_invested: number
  unit_count: number
  products_with_costs: ProductWithCosts[]
}

export const EXPENSE_CATEGORIES = [
  'Transport',
  'Carburant',
  'Livraison',
  'Douane',
  'Emballage',
  'Nourriture',
  'Hébergement',
  'Autre',
] as const

export const PRODUCT_CATEGORIES = [
  'Vêtements',
  'Électronique',
  'Accessoires',
  'Maison & Vie',
  'Beauté',
  'Alimentation',
  'Jouets',
  'Autre',
] as const

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  open: 'En cours',
  arrived: 'Arrivé',
  closed: 'Clôturé',
}

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  arrived: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}
