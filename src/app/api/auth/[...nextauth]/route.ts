import { handlers } from '@/auth';
export const { GET, POST } = handlers;
// Ensure this route runs in Node runtime where secrets are available
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
