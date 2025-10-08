
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyCYlzqp4ohFgH-Nw1NdIIkKr4U3HX7xwls",
  authDomain: "unite-3409c.firebaseapp.com",
  databaseURL: "https://unite-3409c-default-rtdb.firebaseio.com",
  projectId: "unite-3409c",
  storageBucket: "unite-3409c.appspot.com",
  messagingSenderId: "608397760209",
  appId: "1:608397760209:web:96c7edde0c8d59e49b17f0"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, app, storage };
