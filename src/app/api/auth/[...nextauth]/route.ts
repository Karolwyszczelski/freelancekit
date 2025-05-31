// app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
// Jeśli chcesz użyć np. Google, odkomentuj i skonfiguruj:
// import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  // Tutaj możesz dodać dowolnych providerów
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Przykład innego providera:
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_ID!,
    //   clientSecret: process.env.GOOGLE_SECRET!,
    // }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Tutaj możesz też dodać inne opcje (callbacks, pages, session itp.)
};

const handler = NextAuth(authOptions);

// App Router w Next 13 wymaga oddzielnych eksportów na GET i POST
export { handler as GET, handler as POST };
