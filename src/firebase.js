// src/firebase.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4Zy8ebGeRG-w_xs0Hz0BJk3qtdu44TSg",
  authDomain: "danecast.firebaseapp.com",
  projectId: "danecast",
  storageBucket: "danecast.appspot.com",
  messagingSenderId: "785367255419",
  appId: "1:785367255419:web:f4fb5d4fdb19d599c155de",
  measurementId: "G-9TBM2LWGWY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it for other parts of your app to use
export const db = getFirestore(app);
