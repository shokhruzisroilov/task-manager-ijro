import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import './Button.css'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  disabled,
  children,
  className,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return

    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = { x, y, id: Date.now() }
    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)

    onClick?.(e)
  }

  return (
    <motion.button
      {...(props as any)}
      className={cn(
        'button',
        `button--${variant}`,
        `button--${size}`,
        loading && 'button--loading',
        fullWidth && 'button--full-width',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      onClick={handleClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="button__ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      {loading ? (
        <span className="button__spinner" aria-label="Loading">
          <motion.span
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          />
        </span>
      ) : (
        <>
          {icon && <span className="button__icon">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  )
}
