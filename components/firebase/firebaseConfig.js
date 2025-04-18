// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIr81eVJPi3rQ47xO1-6HBhqp8UKzdiEM",
  authDomain: "quote-app-2316f.firebaseapp.com",
  projectId: "quote-app-2316f",
  storageBucket: "quote-app-2316f.firebasestorage.app",
  messagingSenderId: "141232251745",
  appId: "1:141232251745:web:1105256d783cfde63a5b20",
  measurementId: "G-SNGLRHLH3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);