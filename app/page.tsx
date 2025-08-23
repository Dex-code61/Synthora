import { redirect } from 'next/navigation'
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function Home() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  // Redirect unauthenticated users to sign-in
  redirect('/auth/signin')
}