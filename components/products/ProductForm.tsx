'use client'
import { useState, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import Image from 'next/image'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { createProduct, updateProduct, uploadProductImage } from '@/lib/db'
import type { Product, StockStatus } from '@/lib/types'
import { PRODUCT_CATEGORIES } from '@/lib/types'

interface ProductFormProps {
  product?: Product
  onSave: (product: Product) => void
  onCancel: () => void
}

const statusOptions = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'ready', label: 'Ready to list' },
  { value: 'sold', label: 'Sold' },
]

const categoryOptions = PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [purchasePrice, setPurchasePrice] = useState(String(product?.purchase_price ?? ''))
  const [quantity, setQuantity] = useState(String(product?.quantity ?? '1'))
  const [category, setCategory] = useState(product?.category ?? '')
  const [stockStatus, setStockStatus] = useState<StockStatus>(product?.stock_status ?? 'in_stock')
  const [manualPrice, setManualPrice] = useState(String(product?.manual_price ?? ''))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Product name is required')
    const price = parseFloat(purchasePrice)
    const qty = parseInt(quantity)
    if (isNaN(price) || price <= 0) return setError('Enter a valid purchase price')
    if (isNaN(qty) || qty <= 0) return setError('Enter a valid quantity')

    setLoading(true)
    setError('')

    try {
      let imageUrl = product?.image_url ?? null

      const payload = {
        name: name.trim(),
        purchase_price: price,
        quantity: qty,
        category: category || null,
        stock_status: stockStatus,
        manual_price: manualPrice ? parseFloat(manualPrice) : null,
        image_url: imageUrl,
      }

      let saved: Product
      if (product) {
        saved = await updateProduct(product.id, payload)
      } else {
        saved = await createProduct(payload)
      }

      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, saved.id)
        saved = await updateProduct(saved.id, { image_url: imageUrl })
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
      {/* Image upload */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer relative border-2 border-dashed border-gray-200 hover:border-indigo-300 transition"
          onClick={() => fileRef.current?.click()}
        >
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="preview" fill className="object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow"
                onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
              >
                <X size={12} className="text-gray-600" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Camera size={24} />
              <span className="text-xs">Add photo</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      <Input
        label="Product name *"
        placeholder="e.g. Nike Air Force 1"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Purchase price *"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          suffix="MAD"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />
        <Input
          label="Quantity *"
          type="number"
          min="1"
          placeholder="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <Select
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Select category"
      />

      <Select
        label="Stock status"
        options={statusOptions}
        value={stockStatus}
        onChange={(e) => setStockStatus(e.target.value as StockStatus)}
      />

      <Input
        label="Manual selling price (optional)"
        type="number"
        min="0"
        step="0.01"
        placeholder="Leave blank to use suggested price"
        suffix="MAD"
        value={manualPrice}
        onChange={(e) => setManualPrice(e.target.value)}
      />

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {product ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  )
}
