interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="container px-8 lg:px-0 mx-auto py-6">
      {children}
    </main>
  )
}