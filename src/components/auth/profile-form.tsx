"use client";

import * as React from "react";
import {
  userProfileSchema,
  updateUserProfileSchema,
} from "@/lib/validations/auth";
import { AuthForm, AuthFormField, NameField, EmailField } from "./auth-form";
import { ErrorMessage, SuccessMessage } from "./auth-messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileFormProps {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  onUpdateProfile?: (data: {
    name?: string;
    email?: string;
    image?: string | null;
  }) => void | Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: string;
  className?: string;
}

export function ProfileForm({
  user,
  onUpdateProfile,
  isLoading = false,
  error,
  success,
  className,
}: ProfileFormProps) {
  const defaultValues = {
    name: user?.name || "",
    email: user?.email || "",
    image: user?.image || null,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your profile information and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {success && <SuccessMessage>{success}</SuccessMessage>}

        {/* Profile Avatar */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user?.image || undefined}
              alt={user?.name || "User"}
            />
            <AvatarFallback className="text-lg">
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user?.name || "Anonymous User"}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        {onUpdateProfile && (
          <AuthForm
            schema={updateUserProfileSchema}
            onSubmit={onUpdateProfile}
            defaultValues={defaultValues}
            isLoading={isLoading}
            submitText="Update Profile"
            loadingText="Updating..."
          >
            <NameField />
            <EmailField />
            <AuthFormField
              name="image"
              label="Profile Image URL"
              type="text"
              placeholder="https://example.com/avatar.jpg"
              description="Optional: Enter a URL for your profile image"
            />
          </AuthForm>
        )}
      </CardContent>
    </Card>
  );
}
