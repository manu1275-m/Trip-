import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA9hwv4XtEW3NZ08ODyrhLZpROxrfmpuI",
  authDomain: "agentic-434de.firebaseapp.com",
  projectId: "agentic-434de",
  storageBucket: "agentic-434de.firebasestorage.app",
  messagingSenderId: "381711201791",
  appId: "1:381711201791:web:2dc042e64d98fc8e09e3ca",
  measurementId: "G-8CRPZQHVFX"
};

// Initialize Firebase safely for Next.js SSR
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
