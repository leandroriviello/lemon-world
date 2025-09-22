import { NextResponse } from 'next/server';

export async function GET() {
  // Only expose booleans/metadata, never actual secrets
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);
  const hasNextAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  const hasHmacSecretKey = Boolean(process.env.HMAC_SECRET_KEY);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
  const trustHost = process.env.AUTH_TRUST_HOST || '';

  return NextResponse.json({
    nodeEnv,
    hasAuthSecret,
    hasNextAuthSecret,
    hasHmacSecretKey,
    authUrlSet: Boolean(authUrl),
    trustHostSet: Boolean(trustHost),
  });
}
