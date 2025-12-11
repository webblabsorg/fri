'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ checked = false, onCheckedChange, className, ...props }: SwitchProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event)
    if (!event.defaultPrevented) {
      onCheckedChange?.(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border border-gray-300 transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-200',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  )
}
