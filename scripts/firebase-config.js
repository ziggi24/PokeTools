// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDTYEbwT2VRB0zKSVTMrFDAIsxbZZhMUs",
    authDomain: "poketools-auth.firebaseapp.com",
    projectId: "poketools-auth",
    storageBucket: "poketools-auth.firebasestorage.app",
    messagingSenderId: "743575260088",
    appId: "1:743575260088:web:286fa054b18baa97779d4d",
    measurementId: "G-00XTWPWFJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let analytics = null;

// Initialize Analytics only in browser environment
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (error) {
        console.warn('Analytics initialization failed:', error);
    }
}

export { app, auth, db, analytics };

