'use client'

import * as React from 'react'

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface RadioGroupItemProps {
  value: string
  id: string
  className?: string
}

const RadioGroupContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={`space-y-2 ${className || ''}`} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

export function RadioGroupItem({ value, id, className }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  
  if (!context) {
    throw new Error('RadioGroupItem must be used within a RadioGroup')
  }

  const isChecked = context.value === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      id={id}
      onClick={() => context.onValueChange(value)}
      className={`
        h-4 w-4 rounded-full border border-gray-300 
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isChecked ? 'border-blue-600' : 'border-gray-300'}
        ${className || ''}
      `}
    >
      {isChecked && (
        <div className="h-2 w-2 rounded-full bg-blue-600" />
      )}
    </button>
  )
}
