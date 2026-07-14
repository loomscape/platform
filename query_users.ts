import fs from "fs";
import path from "path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const databaseId = "ai-studio-loomscape-07c1cd07-f002-4e17-a824-84a4118b6daa";
let firestoreDb: any = null;

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID;

if (privateKey && clientEmail && projectId) {
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  const firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    })
  }, "query-app");
  firestoreDb = getFirestore(firebaseApp, databaseId);
} else {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp({
      projectId: firebaseConfig.projectId,
    }, "query-app");
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
  }
}

async function run() {
  console.log("Checking Firestore Users...");
  if (!firestoreDb) {
    console.log("No live Firestore connection. Only reading local database.");
  } else {
    try {
      const usersSnapshot = await firestoreDb.collection("users").get();
      console.log(`Live Firestore Users Count: ${usersSnapshot.size}`);
      usersSnapshot.forEach((doc: any) => {
        console.log(`Firestore User:`, JSON.stringify(doc.data(), null, 2));
      });
    } catch (e) {
      console.error("Error reading from Firestore:", e);
    }
  }

  const dbPath = path.join(process.cwd(), "data", "db.json");
  if (fs.existsSync(dbPath)) {
    const localDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    console.log(`Local DB Users Count: ${localDb.users ? localDb.users.length : 0}`);
    console.log(`Local DB Users:`, JSON.stringify(localDb.users, null, 2));
  } else {
    console.log("Local db.json file not found.");
  }
}

run();
