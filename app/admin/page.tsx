import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import UserTable from "@/components/admin/user-table"
import { Button } from "@/components/ui/button"

async function SignOutButton() {
  async function logout() {
    "use server"
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/auth/logout`, {
      method: "POST",
      cache: "no-store",
    })
  }
  // In Next.js, server actions are supported; this simple button uses a normal POST in client instead:
  return null
}

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?redirect=/admin")
  if (user.role !== "admin") redirect("/")

  return (
    <main className="container mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Portal</h1>
          <p className="text-muted-foreground text-sm">Signed in as {user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
      <UserTable />
    </main>
  )
}
