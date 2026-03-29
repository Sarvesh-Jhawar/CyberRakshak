// Simple frontend-only mock authentication for development without backend
type Credentials = { email: string; password: string }

const MOCK_USERS = [
  { email: "admin@cyber.local", password: "admin123", role: "ADMIN", token: "mock-admin-token" },
  { email: "user@cyber.local", password: "user123", role: "USER", token: "mock-user-token" },
]

export async function mockLogin({ email, password }: Credentials) {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 400))

  const normalizedEmail = (email || "").toString().trim().toLowerCase()
  const normalizedPassword = (password || "").toString().trim()

  console.log("[mockLogin] attempt", { email: normalizedEmail })

  const found = MOCK_USERS.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === normalizedPassword)
  if (!found) {
    const err: any = new Error("Invalid credentials")
    err.status = 401
    throw err
  }

  return {
    access_token: found.token,
    role: found.role,
    user: { email: found.email },
  }
}

export function isMockAuthEnabled() {
  // Toggle mock auth globally by returning true here, or read an env/flag later.
  return false
}
