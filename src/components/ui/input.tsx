import * as React from 'react'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────
   INPUT — Full-featured form input with label, helper, error.

   Usage:
   <Input label="Email" type="email" placeholder="you@example.com" />
   <Input label="Name" error="Name is required" />
   <Input label="Search" leftIcon={<SearchIcon />} />
   ───────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helper, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId()
    const helperId = `${inputId}-helper`
    const errorId  = `${inputId}-error`

    const hasError  = Boolean(error)
    const hasHelper = Boolean(helper) && !hasError

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-small font-medium text-text-primary"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-error" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Input wrapper — handles icon positioning */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              hasError ? errorId : hasHelper ? helperId : undefined
            }
            aria-invalid={hasError || undefined}
            className={cn(
              // Base
              'h-10 w-full rounded border bg-surface text-body text-text-primary',
              'transition-colors duration-fast',
              'outline-none',

              // Placeholder
              'placeholder:text-text-disabled',

              // Border states
              hasError
                ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(153,27,27,0.15)]'
                : 'border-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(28,61,90,0.15)]',

              // Icon padding
              leftIcon  ? 'pl-9'  : 'pl-3',
              rightIcon ? 'pr-9'  : 'pr-3',

              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-border-subtle',

              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} role="alert" className="text-small text-error">
            {error}
          </p>
        )}

        {/* Helper text */}
        {hasHelper && (
          <p id={helperId} className="text-small text-text-secondary">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

/* ─────────────────────────────────────────────────────────
   TEXTAREA — Same interface as Input, multi-line
   ───────────────────────────────────────────────────────── */

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helper?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helper, error, id, ...props }, ref) => {
    const inputId = id ?? React.useId()
    const helperId = `${inputId}-helper`
    const errorId  = `${inputId}-error`

    const hasError  = Boolean(error)
    const hasHelper = Boolean(helper) && !hasError

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-small font-medium text-text-primary"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-error" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={
            hasError ? errorId : hasHelper ? helperId : undefined
          }
          aria-invalid={hasError || undefined}
          className={cn(
            'w-full min-h-[96px] rounded border bg-surface px-3 py-2.5',
            'text-body text-text-primary leading-relaxed',
            'resize-y transition-colors duration-fast outline-none',
            'placeholder:text-text-disabled',
            hasError
              ? 'border-error focus:border-error focus:shadow-[0_0_0_3px_rgba(153,27,27,0.15)]'
              : 'border-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(28,61,90,0.15)]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-border-subtle',
            className
          )}
          {...props}
        />

        {hasError && (
          <p id={errorId} role="alert" className="text-small text-error">
            {error}
          </p>
        )}

        {hasHelper && (
          <p id={helperId} className="text-small text-text-secondary">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Input, Textarea }
