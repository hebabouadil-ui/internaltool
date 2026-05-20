import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  suffix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            {...props}
            className={`
              w-full border rounded-xl px-3 py-2.5 text-sm text-gray-800
              placeholder:text-gray-400 outline-none transition
              border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20
              disabled:bg-gray-50 disabled:text-gray-500
              ${suffix ? 'pr-14' : ''}
              ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
              ${className}
            `}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
