"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AuthFormProps<T extends z.ZodTypeAny> {
  schema: T;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  defaultValues?: z.infer<T>;
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  submitText?: string;
  loadingText?: string;
}

export function AuthForm<T extends z.ZodTypeAny>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
  isLoading = false,
  submitText = "Submit",
  loadingText = "Loading...",
}: AuthFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
  });

  const [internalLoading, setInternalLoading] = React.useState(false);
  const isFormLoading = isLoading || internalLoading;

  const handleSubmit = async (data: z.infer<T>) => {
    try {
      setInternalLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-4", className)}
      >
        {children}
        <Button type="submit" className="w-full" disabled={isFormLoading}>
          {isFormLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {loadingText}
            </>
          ) : (
            submitText
          )}
        </Button>
      </form>
    </Form>
  );
}

// Pre-built form field components for common auth fields
interface AuthFormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password";
  className?: string;
}

export function AuthFormField({
  name,
  label,
  placeholder,
  description,
  type = "text",
  className,
}: AuthFormFieldProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Specific form components for authentication
export function EmailField({ className }: { className?: string }) {
  return (
    <AuthFormField
      name="email"
      label="Email"
      type="email"
      placeholder="Enter your email"
      className={className}
    />
  );
}

export function PasswordField({ className }: { className?: string }) {
  return (
    <AuthFormField
      name="password"
      label="Password"
      type="password"
      placeholder="Enter your password"
      className={className}
    />
  );
}

export function NameField({ className }: { className?: string }) {
  return (
    <AuthFormField
      name="name"
      label="Name"
      type="text"
      placeholder="Enter your name"
      className={className}
    />
  );
}
