import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeaA4EWHYxEuGuSTHpCekN8FkI54qFKqQ",
  authDomain: "crestup-education.firebaseapp.com",
  projectId: "crestup-education",
  storageBucket: "crestup-education.appspot.com",
  messagingSenderId: "1079490394066",
  appId: "1:1079490394066:web:3e8c71cdc8528972573a0b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
