import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB1UmksGKpf2kG9_kCIaPns1CNpf16ToBc",
  authDomain: "my-travel-app-43469.firebaseapp.com",
  projectId: "my-travel-app-43469",
  storageBucket: "my-travel-app-43469.firebasestorage.app",
  messagingSenderId: "781957445432",
  appId: "1:781957445432:web:550abf0ebf66f6814533cd",
  measurementId: "G-1CC5M72D0V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const isUserAuthenticated = () => {
  return auth.currentUser !== null;
};
