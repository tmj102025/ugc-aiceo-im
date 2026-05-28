import PocketBase from 'pocketbase';

let pbInstance: PocketBase | null = null;
let authPromise: Promise<void> | null = null;

export function pb(): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(process.env.POCKETBASE_URL || 'https://db.aiceo.im');
  }
  return pbInstance;
}

export async function ensureAdminAuth(): Promise<void> {
  const client = pb();
  if (client.authStore.isValid) return;
  if (!authPromise) {
    authPromise = (async () => {
      const email = process.env.POCKETBASE_ADMIN_EMAIL;
      const password = process.env.POCKETBASE_ADMIN_PASSWORD;
      if (!email || !password) throw new Error('PB admin credentials missing');
      await client.collection('_superusers').authWithPassword(email, password);
    })().finally(() => {
      authPromise = null;
    });
  }
  await authPromise;
}
