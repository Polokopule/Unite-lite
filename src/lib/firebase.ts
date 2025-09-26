// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "unite-XXXXX.firebaseapp.com",
  databaseURL: "https://unite-XXXXX.firebaseio.com",
  projectId: "unite-XXXXX",
  storageBucket: "unite-XXXXX.appspot.com",
  messagingSenderId: "MSID",
  appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };
