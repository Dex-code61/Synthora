import React from "react";
import { render, screen } from "@testing-library/react";
import {
  SuccessMessage,
  ErrorMessage,
  InfoMessage,
  WarningMessage,
  LoadingMessage,
} from "@/components/auth/auth-messages";
import { describe, expect, it } from "vitest";

describe("Auth Messages", () => {
  describe("SuccessMessage", () => {
    it("renders success message", () => {
      render(<SuccessMessage>Success!</SuccessMessage>);
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <SuccessMessage className="custom-class">Success!</SuccessMessage>
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("ErrorMessage", () => {
    it("renders error message", () => {
      render(<ErrorMessage>Error occurred!</ErrorMessage>);
      expect(screen.getByText("Error occurred!")).toBeInTheDocument();
    });

    it("has destructive variant", () => {
      const { container } = render(<ErrorMessage>Error!</ErrorMessage>);
      // The Alert component should have destructive styling
      const alertElement = container.firstChild as HTMLElement;
      expect(alertElement).toHaveClass("border-destructive");
      expect(alertElement).toHaveClass("text-destructive");
    });
  });

  describe("InfoMessage", () => {
    it("renders info message", () => {
      render(<InfoMessage>Information here</InfoMessage>);
      expect(screen.getByText("Information here")).toBeInTheDocument();
    });

    it("has info styling", () => {
      const { container } = render(<InfoMessage>Info!</InfoMessage>);
      // The Alert component should have info styling
      const alertElement = container.firstChild as HTMLElement;
      expect(alertElement).toHaveClass("border-blue-500");
      expect(alertElement).toHaveClass("text-blue-800");
    });
  });

  describe("WarningMessage", () => {
    it("renders warning message", () => {
      render(<WarningMessage>Warning!</WarningMessage>);
      expect(screen.getByText("Warning!")).toBeInTheDocument();
    });

    it("has warning styling", () => {
      const { container } = render(<WarningMessage>Warning!</WarningMessage>);
      expect(container.firstChild).toHaveClass(
        "border-yellow-200",
        "bg-yellow-50",
        "text-yellow-800"
      );
    });
  });

  describe("LoadingMessage", () => {
    it("renders with default loading text", () => {
      render(<LoadingMessage />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      render(<LoadingMessage message="Processing..." />);
      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<LoadingMessage className="custom-class" />);
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("has loading spinner", () => {
      const { container } = render(<LoadingMessage />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });
});
