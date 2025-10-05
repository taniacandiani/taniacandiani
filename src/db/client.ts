import { Nile } from '@niledatabase/server';

// Initialize Nile (lazy initialization)
let _nile: Awaited<ReturnType<typeof Nile>> | null = null;

export async function getNile() {
  if (!_nile) {
    _nile = await Nile({
      secureCookies: process.env.VERCEL === "1",
    });
  }
  return _nile;
}
