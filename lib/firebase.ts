import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, push, get, child, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBVW2Vsc_iADXcBGUT0EqomqMbyjYElb_k",
  authDomain: "basedatoskeyauth.firebaseapp.com",
  projectId: "basedatoskeyauth",
  storageBucket: "basedatoskeyauth.firebasestorage.app",
  messagingSenderId: "354819705167",
  appId: "1:354819705167:web:0e947e80e1ead15ef7dd3a",
  measurementId: "G-GMXREKC06P",
  databaseURL: "https://basedatoskeyauth-default-rtdb.firebaseio.com",
};

let app: any;
let db: any;

export function getFirebaseApp() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseDb() {
  if (!db) {
    getFirebaseApp();
    db = getDatabase();
  }
  return db;
}

export async function saveUserToFirebase(adminId: string, data: {
  email: string;
  credits: number;
  subscriptionEnd: string | null;
  role: string;
}) {
  const database = getFirebaseDb();
  await set(ref(database, `users/${adminId}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function logTransactionToFirebase(adminId: string, transaction: {
  type: "purchase" | "usage" | "bonus" | "subscription";
  amount: number;
  description: string;
}) {
  const database = getFirebaseDb();
  const txRef = push(ref(database, `users/${adminId}/transactions`));
  await set(txRef, {
    ...transaction,
    created_at: new Date().toISOString(),
  });
}

export async function getFirebaseUser(adminId: string) {
  const database = getFirebaseDb();
  const snapshot = await get(child(ref(database), `users/${adminId}`));
  return snapshot.exists() ? snapshot.val() : null;
}
