import type { Product, Expense, ProductWithCosts, DashboardStats } from './types'

export function calculateProductCosts(
  product: Product,
  expenses: Expense[],
  allProducts: Product[]
): ProductWithCosts {
  const totalUnits = allProducts.reduce((sum, p) => sum + p.quantity, 0)
  const productShare = totalUnits > 0 ? product.quantity / totalUnits : 0
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0)

  const totalPurchaseCost = product.purchase_price * product.quantity
  const allocatedExpenses = totalExpensesAmount * productShare
  const realCostTotal = totalPurchaseCost + allocatedExpenses
  const costPerUnit = product.quantity > 0 ? realCostTotal / product.quantity : 0

  const suggestedLow = costPerUnit * 1.3
  const suggestedMid = costPerUnit * 1.5
  const suggestedHigh = costPerUnit * 1.8

  const profitAtLow = suggestedLow - costPerUnit
  const profitAtMid = suggestedMid - costPerUnit
  const profitAtHigh = suggestedHigh - costPerUnit

  return {
    ...product,
    total_purchase_cost: totalPurchaseCost,
    allocated_expenses: allocatedExpenses,
    real_cost_total: realCostTotal,
    cost_per_unit: costPerUnit,
    suggested_low: suggestedLow,
    suggested_mid: suggestedMid,
    suggested_high: suggestedHigh,
    profit_at_low: profitAtLow,
    profit_at_mid: profitAtMid,
    profit_at_high: profitAtHigh,
    margin_at_low: suggestedLow > 0 ? (profitAtLow / suggestedLow) * 100 : 0,
    margin_at_mid: suggestedMid > 0 ? (profitAtMid / suggestedMid) * 100 : 0,
    margin_at_high: suggestedHigh > 0 ? (profitAtHigh / suggestedHigh) * 100 : 0,
  }
}

export function calculateDashboardStats(
  products: Product[],
  expenses: Expense[]
): DashboardStats {
  const totalProductsCost = products.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  // Real total invested = products + all expenses
  const totalInvested = totalProductsCost + totalExpenses

  const allProductsWithCosts = products.map((p) =>
    calculateProductCosts(p, expenses, products)
  )

  const inStockProducts = allProductsWithCosts.filter((p) => p.stock_status !== 'sold')
  const soldProducts = allProductsWithCosts.filter((p) => p.stock_status === 'sold')

  const expectedRevenue = allProductsWithCosts.reduce((sum, p) => {
    const price = p.manual_price ?? p.suggested_mid
    return sum + price * p.quantity
  }, 0)

  const estimatedProfit = expectedRevenue - totalInvested
  const overallMargin = expectedRevenue > 0 ? (estimatedProfit / expectedRevenue) * 100 : 0

  return {
    total_invested: totalInvested,
    total_products_cost: totalProductsCost,
    total_expenses: totalExpenses,
    expected_revenue: expectedRevenue,
    estimated_profit: estimatedProfit,
    overall_margin: overallMargin,
    total_products: products.length,
    products_in_stock: inStockProducts.length,
    products_sold: soldProducts.length,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MAD'
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%'
}
