import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitHubSignInButton } from "@/components/auth/github-signin-button";

describe("GitHubSignInButton", () => {
  it("renders with default text", () => {
    render(<GitHubSignInButton />);
    expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
  });

  it("renders with custom text", () => {
    render(<GitHubSignInButton>Sign in with GitHub</GitHubSignInButton>);
    expect(screen.getByText("Sign in with GitHub")).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(<GitHubSignInButton isLoading={true} />);
    expect(screen.getByText("Signing in...")).toBeInTheDocument();
    expect(screen.queryByText("Continue with GitHub")).not.toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<GitHubSignInButton disabled={true} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("calls onSignIn when clicked", async () => {
    const mockOnSignIn = vi.fn();
    render(<GitHubSignInButton onSignIn={mockOnSignIn} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows internal loading state during async onSignIn", async () => {
    const mockOnSignIn = vi.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 100))
    );
    render(<GitHubSignInButton onSignIn={mockOnSignIn} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    });
  });

  it("handles onSignIn errors gracefully", async () => {
    const mockOnSignIn = vi.fn(() => Promise.reject(new Error("Test error")));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<GitHubSignInButton onSignIn={mockOnSignIn} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "GitHub sign-in error:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("does not call onSignIn when disabled", () => {
    const mockOnSignIn = vi.fn();
    render(<GitHubSignInButton onSignIn={mockOnSignIn} disabled={true} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnSignIn).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<GitHubSignInButton className="custom-class" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
