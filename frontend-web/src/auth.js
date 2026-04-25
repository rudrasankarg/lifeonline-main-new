// NextAuth v5 (beta) – Google OAuth for doctor portal
// Docs: https://authjs.dev/getting-started/providers/google

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Whitelist check – if ALLOWED_DOCTOR_EMAILS is set, only those emails
 * can sign in. If the env var is empty/unset, any Google account is allowed
 * (useful for dev; lock this down in production).
 */
function isDoctorAllowed(email) {
  const allowed = process.env.ALLOWED_DOCTOR_EMAILS || '';
  if (!allowed.trim()) return true; // open in dev
  return allowed.split(',').map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // ── Callbacks ──────────────────────────────────────────────────────────────
  callbacks: {
    /**
     * Called after a successful sign-in.
     * Return false to block access for non-whitelisted emails.
     */
    async signIn({ user }) {
      if (!isDoctorAllowed(user.email)) {
        return false; // triggers 403 / AccessDenied page
      }
      return true;
    },

    /**
     * Augment the JWT with the user's email and image so the session
     * contains everything the UI needs without extra DB calls.
     */
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.picture = profile?.picture || token.picture;
      }
      return token;
    },

    /**
     * Expose the token fields to the client-side session object.
     */
    async session({ session, token }) {
      session.user.id = token.sub;
      session.accessToken = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn: '/login',          // custom login page
    error: '/login',           // redirect errors to login page
  },
});
