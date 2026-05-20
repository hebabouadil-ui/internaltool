export type StockStatus = 'in_stock' | 'ready' | 'sold'

export interface Product {
  id: string
  name: string
  image_url: string | null
  purchase_price: number
  quantity: number
  category: string | null
  stock_status: StockStatus
  manual_price: number | null
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
  created_at: string
}

export interface ProductWithCosts extends Product {
  total_purchase_cost: number
  allocated_expenses: number
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
  expected_revenue: number
  estimated_profit: number
  overall_margin: number
  total_products: number
  products_in_stock: number
  products_sold: number
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
