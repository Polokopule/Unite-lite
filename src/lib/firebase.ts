
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "unite-3409c.firebaseapp.com",
  databaseURL: "https://unite-3409c-default-rtdb.firebaseio.com/",
  projectId: "unite-3409c",
  storageBucket: "unite-3409c.appspot.com",
  messagingSenderId: "MSID",
  appId: "APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth, app };

