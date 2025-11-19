// Authentication Module
import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

// Login with Google
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("User logged in:", result.user);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Login failed", error);
        
        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized. Please contact the site administrator or check Firebase Console settings.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in popup was closed. Please try again.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        return { success: false, error: errorMessage, code: error.code };
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth);
        console.log("User logged out");
        return { success: true };
    } catch (error) {
        console.error("Logout failed", error);
        return { success: false, error: error.message };
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Auth state change listener
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

