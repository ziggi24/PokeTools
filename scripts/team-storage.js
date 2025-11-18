// Team Storage Module - Firestore Operations
import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Save team to Firestore
export async function saveTeam(teamData, generation) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User must be authenticated to save teams");
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        // Prepare team object
        const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTeam = {
            teamId: teamId,
            pokemon: teamData.map(pokemon => pokemon ? {
                id: pokemon.id,
                name: pokemon.name,
                sprites: pokemon.sprites,
                types: pokemon.types,
                stats: pokemon.stats
            } : null),
            generation: generation,
            createdAt: Timestamp.now()
        };

        if (userSnap.exists()) {
            // User document exists, update teams array
            const userData = userSnap.data();
            const teams = userData.teams || [];
            teams.push(newTeam);
            await updateDoc(userRef, {
                teams: teams,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            });
        } else {
            // Create new user document
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                teams: [newTeam]
            });
        }

        return { success: true, teamId: teamId };
    } catch (error) {
        console.error("Error saving team:", error);
        throw error;
    }
}

// Load all teams for current user
export async function loadUserTeams() {
    const user = auth.currentUser;
    if (!user) {
        return [];
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.teams || [];
        }
        return [];
    } catch (error) {
        console.error("Error loading teams:", error);
        return [];
    }
}

// Delete a specific team
export async function deleteTeam(teamId) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("User must be authenticated to delete teams");
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const teams = userData.teams || [];
            const filteredTeams = teams.filter(team => team.teamId !== teamId);
            
            await updateDoc(userRef, {
                teams: filteredTeams
            });
            
            return { success: true };
        }
        throw new Error("User document not found");
    } catch (error) {
        console.error("Error deleting team:", error);
        throw error;
    }
}

// Delete user account and all data
export async function deleteUserAccount() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user to delete");
    }

    try {
        // Delete user document from Firestore
        const userRef = doc(db, "users", user.uid);
        await deleteDoc(userRef);
        
        // Note: Firebase Auth account deletion requires additional setup
        // For now, we'll just delete the Firestore data
        // The user can manually delete their auth account if needed
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error;
    }
}

// Get user document data
export async function getUserData() {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }

    try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error loading user data:", error);
        return null;
    }
}

