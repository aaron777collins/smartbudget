"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { Input, type InputProps } from "./input"
import { Textarea, type TextareaProps } from "./textarea"

export interface FormFieldProps {
  /** Unique identifier for the field */
  id: string
  /** Label text */
  label: string
  /** Error message to display */
  error?: string
  /** Helper text to show below the input */
  helperText?: string
  /** Whether to use floating label style (default: true) */
  floating?: boolean
  /** Show character count for inputs with maxLength */
  showCharCount?: boolean
  /** Whether the field is required */
  required?: boolean
  /** Additional class name for the wrapper */
  className?: string
}

export interface FormInputFieldProps extends FormFieldProps, Omit<InputProps, 'id' | 'error'> {
  /** Input type - determines whether to use Input or Textarea */
  type?: React.HTMLInputTypeAttribute
}

export interface FormTextareaFieldProps extends FormFieldProps, Omit<TextareaProps, 'id' | 'error'> {
  /** Must be 'textarea' for textarea fields */
  type: 'textarea'
}

type CombinedFormFieldProps = FormInputFieldProps | FormTextareaFieldProps

/**
 * FormField component with floating labels, error messages, and validation feedback.
 *
 * @example
 * // Basic input with floating label
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   required
 * />
 *
 * @example
 * // Input with error state
 * <FormField
 *   id="password"
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * @example
 * // Textarea with character count
 * <FormField
 *   id="description"
 *   label="Description"
 *   type="textarea"
 *   maxLength={200}
 *   showCharCount
 * />
 */
export const FormField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  CombinedFormFieldProps
>(({
  id,
  label,
  error,
  helperText,
  floating = true,
  showCharCount = false,
  required = false,
  className,
  type,
  maxLength,
  value,
  defaultValue,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)
  const [charCount, setCharCount] = React.useState(0)

  // Track if label should be in "floated" position
  const isFloated = floating && (isFocused || hasValue)

  // Update character count and value state
  React.useEffect(() => {
    const currentValue = value ?? defaultValue ?? ''
    const valueStr = String(currentValue)
    setHasValue(valueStr.length > 0)
    setCharCount(valueStr.length)
  }, [value, defaultValue])

  const handleFocus = () => setIsFocused(true)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value.length > 0)
    // Call original onBlur if provided
    if ('onBlur' in props && props.onBlur) {
      props.onBlur(e as any)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setHasValue(newValue.length > 0)
    setCharCount(newValue.length)
    // Call original onChange if provided
    if ('onChange' in props && props.onChange) {
      props.onChange(e as any)
    }
  }

  const hasError = Boolean(error)
  const describedBy = [
    error ? `${id}-error` : undefined,
    helperText ? `${id}-helper` : undefined,
    showCharCount && maxLength ? `${id}-charcount` : undefined,
  ].filter(Boolean).join(' ') || undefined

  const inputProps = {
    id,
    required,
    error: hasError,
    maxLength,
    value,
    defaultValue,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onChange: handleChange,
    'aria-describedby': describedBy,
    placeholder: floating ? '' : props.placeholder,
    ...props,
  }

  const isTextarea = type === 'textarea'

  return (
    <div className={cn("relative w-full", className)}>
      {/* Input or Textarea */}
      <div className="relative">
        {isTextarea ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={cn(
              floating && "pt-6 pb-2",
              (inputProps as TextareaProps).className
            )}
            {...(inputProps as TextareaProps)}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={cn(
              floating && "pt-6 pb-2",
              (inputProps as InputProps).className
            )}
            {...(inputProps as InputProps)}
          />
        )}

        {/* Floating Label */}
        {floating && (
          <Label
            htmlFor={id}
            className={cn(
              "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
              "text-muted-foreground",
              isFloated
                ? "top-1.5 text-xs font-medium"
                : "top-1/2 -translate-y-1/2 text-sm",
              hasError && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        )}

        {/* Static Label (non-floating) */}
        {!floating && (
          <Label
            htmlFor={id}
            className={cn(
              "block mb-2 text-sm font-medium",
              hasError && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={`${id}-helper`}
          className="mt-1.5 text-xs text-muted-foreground"
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs text-destructive flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Character Count */}
      {showCharCount && maxLength && (
        <p
          id={`${id}-charcount`}
          className={cn(
            "mt-1.5 text-xs text-right",
            charCount > maxLength * 0.9
              ? "text-destructive"
              : "text-muted-foreground"
          )}
          aria-live="polite"
        >
          {charCount} / {maxLength}
        </p>
      )}
    </div>
  )
})

FormField.displayName = "FormField"
