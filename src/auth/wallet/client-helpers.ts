import crypto from 'crypto';
/**
 * Generates an HMAC-SHA256 hash of the provided nonce using a secret key from the environment.
 * Falls back to AUTH_SECRET/NEXTAUTH_SECRET, and in non-prod to a dev default for local DX.
 * @param {Object} params - The parameters object.
 * @param {string} params.nonce - The nonce to be hashed.
 * @returns {string} The resulting HMAC hash in hexadecimal format.
 */
export const hashNonce = ({ nonce }: { nonce: string }) => {
  const isProd = process.env.NODE_ENV === 'production';
  const rawSecret =
    process.env.HMAC_SECRET_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    '';

  const cleaned = rawSecret.trim();
  const key = cleaned.length > 0 ? cleaned : (!isProd ? 'insecure-development-secret' : undefined);

  if (!key) {
    // Provide a clearer error than crypto would when key is undefined
    throw new Error(
      'HMAC secret missing. Define HMAC_SECRET_KEY or AUTH_SECRET/NEXTAUTH_SECRET in the environment.'
    );
  }

  const hmac = crypto.createHmac('sha256', key);
  hmac.update(nonce);
  return hmac.digest('hex');
};
