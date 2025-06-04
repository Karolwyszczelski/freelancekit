// app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
// Aby dodać Google, odkomentuj i skonfiguruj poniżej:
// import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  // ------------------------------------------------------------------
  // 1) Lista providerów do logowania. Tutaj na razie GitHub:
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Przykład GoogleProvider (jeśli chcesz obsłużyć logowanie przez Google):
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_ID!,
    //   clientSecret: process.env.GOOGLE_SECRET!,
    // }),
  ],

  // ------------------------------------------------------------------
  // 2) Sekret do podpisywania tokenów sesji – wzięty z .env.local
  secret: process.env.NEXTAUTH_SECRET,

  // ------------------------------------------------------------------
  // 3) (Opcjonalnie) Możesz dodać tu callbacks, custom pages, itp.
  // callbacks: {
  //   async session({ session, token, user }) {
  //     // Możesz tu dołożyć dodatkowe pola do obiektu session
  //     return session;
  //   },
  // },
  // pages: {
  //   signIn: '/login',      // własna strona logowania
  //   signOut: '/logout',
  //   error: '/auth/error',  // strona błędu OAuth
  // },
};

const handler = NextAuth(authOptions);

// W App Routerze każdy route.ts eksportuje obsługę GET i POST
export { handler as GET, handler as POST };
