export const config = {
  // JWT secret used to sign/verify session tokens (server-only)
  jwtSecret: process.env.JWT_SECRET || "dev_insecure_change_me",
  // Session cookie settings
  sessionCookieName: "session",
  sessionMaxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  // Allow public signup page? Default false: only admins can create users.
  allowPublicSignup: (process.env.ALLOW_PUBLIC_SIGNUP || "false").toLowerCase() === "true",
}

// Helper to assert required secrets in production
export function assertSecrets() {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET) {
      console.warn("[auth] JWT_SECRET is not set. Set one in your environment for production.")
    }
  }
}
