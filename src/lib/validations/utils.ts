import { z } from "zod"
import type { FieldErrors } from "react-hook-form"

// Utility functions for form validation with react-hook-form
export const getFieldError = (errors: FieldErrors, fieldName: string): string | undefined => {
  const error = errors[fieldName]
  return error?.message as string | undefined
}

export const hasFieldError = (errors: FieldErrors, fieldName: string): boolean => {
  return !!errors[fieldName]
}

// Convert zod errors to react-hook-form compatible format
export const zodErrorToFormErrors = (error: z.ZodError): Record<string, string> => {
  const formErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join(".")
    formErrors[path] = err.message
  })
  
  return formErrors
}

// Validation utilities for API routes
export const validateApiInput = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: zodErrorToFormErrors(error)
      }
    }
    return {
      success: false,
      data: null,
      errors: { general: "Validation failed" }
    }
  }
}

// Server action validation wrapper
export const createValidatedAction = <TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  action: (input: TInput) => Promise<TOutput>
) => {
  return async (input: unknown): Promise<{
    success: boolean
    data?: TOutput
    errors?: Record<string, string>
  }> => {
    const validation = validateApiInput(schema, input)
    
    if (!validation.success) {
      return {
        success: false,
        errors: validation.errors || undefined
      }
    }
    
    try {
      const result = await action(validation.data!)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        errors: { general: error instanceof Error ? error.message : "Action failed" }
      }
    }
  }
}

// Form field validation helpers
export const createFieldValidator = <T>(schema: z.ZodSchema<T>) => {
  return (value: unknown): string | true => {
    try {
      schema.parse(value)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || "Invalid value"
      }
      return "Validation failed"
    }
  }
}

// Async validation for unique fields (like email)
export const createAsyncFieldValidator = <T>(
  schema: z.ZodSchema<T>,
  asyncCheck: (value: T) => Promise<boolean>,
  errorMessage: string
) => {
  return async (value: unknown): Promise<string | true> => {
    try {
      const validatedValue = schema.parse(value)
      const isValid = await asyncCheck(validatedValue)
      return isValid ? true : errorMessage
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || "Invalid value"
      }
      return "Validation failed"
    }
  }
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  url: /^https?:\/\/.+/,
} as const

// Custom zod refinements
export const refinements = {
  strongPassword: (password: string) => {
    return patterns.password.test(password)
  },
  
  validUsername: (username: string) => {
    return patterns.username.test(username)
  },
  
  notEmpty: (value: string) => {
    return value.trim().length > 0
  },
  
  maxWords: (text: string, maxWords: number) => {
    return text.trim().split(/\s+/).length <= maxWords
  },
} as const

// Schema composition utilities
export const composeSchemas = <T extends Record<string, z.ZodType>>(schemas: T) => {
  return z.object(schemas)
}

export const extendSchema = <T extends z.ZodRawShape, U extends z.ZodRawShape>(
  baseSchema: z.ZodObject<T>,
  extension: U
) => {
  return baseSchema.extend(extension)
}

// Conditional validation
export const conditionalSchema = <T>(
  condition: boolean,
  trueSchema: z.ZodSchema<T>,
  falseSchema: z.ZodSchema<T>
) => {
  return condition ? trueSchema : falseSchema
}