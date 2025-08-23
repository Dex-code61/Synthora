import { render, screen } from "@testing-library/react"
import { AuthLayout } from "@/components/auth/auth-layout"

describe("AuthLayout", () => {
  it("renders with title and description", () => {
    render(
      <AuthLayout title="Test Title" description="Test Description">
        <div>Test Content</div>
      </AuthLayout>
    )

    expect(screen.getByText("Test Title")).toBeInTheDocument()
    expect(screen.getByText("Test Description")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("renders without description", () => {
    render(
      <AuthLayout title="Test Title">
        <div>Test Content</div>
      </AuthLayout>
    )

    expect(screen.getByText("Test Title")).toBeInTheDocument()
    expect(screen.queryByText("Test Description")).not.toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(
      <AuthLayout title="Test Title" className="custom-class">
        <div>Test Content</div>
      </AuthLayout>
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("has responsive layout classes", () => {
    const { container } = render(
      <AuthLayout title="Test Title">
        <div>Test Content</div>
      </AuthLayout>
    )

    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass("min-h-screen", "flex", "items-center", "justify-center")
  })
})