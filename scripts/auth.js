// Authentication Module
import { auth } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    GithubAuthProvider,
    signInWithPopup, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

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

// Login with GitHub
export async function loginWithGitHub() {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        console.log("User logged in with GitHub:", result.user);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("GitHub login failed", error);
        
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

// Sign in with Email and Password
export async function loginWithEmailPassword(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in with email:", result.user);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Email login failed", error);
        
        let errorMessage = error.message;
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        return { success: false, error: errorMessage, code: error.code };
    }
}

// Sign up with Email and Password
export async function signUpWithEmailPassword(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up with email:", result.user);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Email signup failed", error);
        
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        return { success: false, error: errorMessage, code: error.code };
    }
}

// Auth state change listener
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

