import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDDXQPJ7iKZeNW_GhRTA344prvBITc0Maw",
  authDomain: "innate-answer-zcvp7.firebaseapp.com",
  projectId: "innate-answer-zcvp7",
  storageBucket: "innate-answer-zcvp7.firebasestorage.app",
  messagingSenderId: "1042786314320",
  appId: "1:1042786314320:web:01f1d2074ad0f668728955",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
