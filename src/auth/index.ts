import { hashNonce } from '@/auth/wallet/client-helpers';
import {
  MiniAppWalletAuthSuccessPayload,
  MiniKit,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module 'next-auth' {
  interface User {
    walletAddress: string;
    username: string;
    profilePictureUrl: string;
  }

  interface Session {
    user: {
      walletAddress: string;
      username: string;
      profilePictureUrl: string;
    } & DefaultSession['user'];
  }
}

// Auth configuration for Wallet Auth based sessions
// For more information on each option (and a full list of options) go to
// https://authjs.dev/getting-started/authentication/credentials
const isProd = process.env.NODE_ENV === 'production';
const rawAuthSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
const cleanedSecret = rawAuthSecret.trim();
const authSecret = cleanedSecret.length > 0 ? cleanedSecret : (!isProd ? 'insecure-development-secret' : undefined);
const whichSecret = cleanedSecret.length > 0
  ? (process.env.AUTH_SECRET ? 'AUTH_SECRET' : 'NEXTAUTH_SECRET')
  : (!isProd ? 'fallback-dev' : 'missing');
console.log(`[auth] Secret source: ${whichSecret}; present=${Boolean(authSecret)}`);
if (!authSecret) {
  console.warn('Auth secret missing. Define AUTH_SECRET or NEXTAUTH_SECRET.');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  session: { strategy: 'jwt' },
  trustHost: true, // Permitir cualquier host en producción
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      // @ts-expect-error Credentials types
      authorize: async ({ nonce, signedNonce, finalPayloadJson }: {
        nonce: string;
        signedNonce: string;
        finalPayloadJson: string;
      }) => {
        const expectedSignedNonce = hashNonce({ nonce });
        if (signedNonce !== expectedSignedNonce) return null;

        let finalPayload: MiniAppWalletAuthSuccessPayload;
        try {
          finalPayload = JSON.parse(finalPayloadJson);
        } catch {
          return null;
        }

        const result = await verifySiweMessage(finalPayload, nonce);
        const addr = result.siweMessageData?.address || finalPayload.address;
        if (!result.isValid || !addr) return null;

        const userInfo = await MiniKit.getUserInfo(addr);
        return {
          id: addr,
          walletAddress: userInfo.walletAddress ?? addr,
          username: userInfo.username ?? '',
          profilePictureUrl: userInfo.profilePictureUrl ?? '',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.walletAddress = token.walletAddress as string;
        session.user.username = token.username as string;
        session.user.profilePictureUrl = token.profilePictureUrl as string;
      }

      return session;
    },
  },
});
