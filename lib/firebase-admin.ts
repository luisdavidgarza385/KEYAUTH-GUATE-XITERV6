import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase, ref, set, push, get, child } from "firebase-admin/database";

const FIREBASE_DATABASE_URL = "https://basedatoskeyauth-default-rtdb.firebaseio.com";
const FIREBASE_SECRET = "MGLx7ywdc046wZSUzZrzZbc8Jcz1s4pRh1heBUiK";

let fbApp: any;

function getFbApp() {
  if (!fbApp) {
    fbApp = getApps().length === 0
      ? initializeApp({
          databaseURL: FIREBASE_DATABASE_URL,
        })
      : getApps()[0];
  }
  return fbApp;
}

export function getFbDb() {
  getFbApp();
  return getDatabase();
}

export async function saveUserToFirebase(adminId: string, data: {
  email: string;
  credits: number;
  subscriptionEnd: string | null;
  role: string;
}) {
  const db = getFbDb();
  await set(ref(db, `users/${adminId}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function logToFirebase(adminId: string, entry: {
  type: string;
  amount: number;
  description: string;
}) {
  const db = getFbDb();
  const txRef = push(ref(db, `users/${adminId}/logs`));
  await set(txRef, {
    ...entry,
    created_at: new Date().toISOString(),
  });
}

export async function getFbUser(adminId: string) {
  const db = getFbDb();
  const snapshot = await get(child(ref(db), `users/${adminId}`));
  return snapshot.exists() ? snapshot.val() : null;
}
