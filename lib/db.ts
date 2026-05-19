import { createClient } from './supabase/client'
import { getDisplayName } from './auth'
import type { Product, Expense, Trip, StockStatus } from './types'

async function getCreatorInfo() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return {
    created_by: user?.id ?? null,
    creator_name: getDisplayName(user),
  }
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'creator_name'>
): Promise<Product> {
  const supabase = createClient()
  const creator = await getCreatorInfo()
  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, ...creator })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<Product> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createExpense(
  expense: Omit<Expense, 'id' | 'created_at' | 'created_by' | 'creator_name'>
): Promise<Expense> {
  const supabase = createClient()
  const creator = await getCreatorInfo()
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, ...creator })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'created_at'>>
): Promise<Expense> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

// ── Trips ─────────────────────────────────────────────────────────────────────

export async function getTrips(): Promise<Trip[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTrip(
  trip: Omit<Trip, 'id' | 'created_at'>
): Promise<Trip> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Image Upload ──────────────────────────────────────────────────────────────

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `products/${productId}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
