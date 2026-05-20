import type { Product, Expense, Trip, ProductWithCosts, DashboardStats, TripStats } from './types'

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
    allocated_customs: 0,
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

export function calculateProductCostsInTrip(
  product: Product,
  allTripProducts: Product[],
  tripExpenses: Expense[],
  customsAmount: number
): ProductWithCosts {
  const totalUnits = allTripProducts.reduce((sum, p) => sum + p.quantity, 0)
  const totalTripPurchase = allTripProducts.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0)

  const productPurchaseCost = product.purchase_price * product.quantity
  const unitShare = totalUnits > 0 ? product.quantity / totalUnits : 0
  // Customs are allocated proportionally by purchase value (more expensive items pay more customs)
  const purchaseShare = totalTripPurchase > 0 ? productPurchaseCost / totalTripPurchase : 0

  const totalExpensesAmount = tripExpenses.reduce((sum, e) => sum + e.amount, 0)
  const allocatedExpenses = totalExpensesAmount * unitShare
  const allocatedCustoms = customsAmount * purchaseShare
  const realCostTotal = productPurchaseCost + allocatedExpenses + allocatedCustoms
  const costPerUnit = product.quantity > 0 ? realCostTotal / product.quantity : 0

  const suggestedLow = costPerUnit * 1.3
  const suggestedMid = costPerUnit * 1.5
  const suggestedHigh = costPerUnit * 1.8

  const profitAtLow = suggestedLow - costPerUnit
  const profitAtMid = suggestedMid - costPerUnit
  const profitAtHigh = suggestedHigh - costPerUnit

  return {
    ...product,
    total_purchase_cost: productPurchaseCost,
    allocated_expenses: allocatedExpenses,
    allocated_customs: allocatedCustoms,
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

export function calculateTripStats(
  trip: Trip,
  allProducts: Product[],
  allExpenses: Expense[]
): TripStats {
  const products = allProducts.filter((p) => p.trip_id === trip.id)
  const expenses = allExpenses.filter((e) => e.trip_id === trip.id)

  const total_purchase = products.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0)
  const customs_amount = total_purchase * (trip.customs_rate / 100)
  const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const total_invested = total_purchase + customs_amount + total_expenses
  const unit_count = products.reduce((sum, p) => sum + p.quantity, 0)

  const products_with_costs = products.map((p) =>
    calculateProductCostsInTrip(p, products, expenses, customs_amount)
  )

  return {
    trip,
    products,
    expenses,
    total_purchase,
    customs_amount,
    total_expenses,
    total_invested,
    unit_count,
    products_with_costs,
  }
}

export function calculateDashboardStats(
  products: Product[],
  expenses: Expense[],
  trips: Trip[]
): DashboardStats {
  const totalProductsCost = products.reduce((sum, p) => sum + p.purchase_price * p.quantity, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Sum customs from all trips based on their products
  const totalCustoms = trips.reduce((sum, trip) => {
    const tripProducts = products.filter((p) => p.trip_id === trip.id)
    const tripPurchase = tripProducts.reduce((s, p) => s + p.purchase_price * p.quantity, 0)
    return sum + tripPurchase * (trip.customs_rate / 100)
  }, 0)

  const totalInvested = totalProductsCost + totalExpenses + totalCustoms

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
    total_customs: totalCustoms,
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
