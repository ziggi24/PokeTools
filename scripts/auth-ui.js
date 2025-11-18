// Authentication UI Module
import { loginWithGoogle, logout, getCurrentUser, onAuthStateChange } from './auth.js';
import { loadUserTeams, deleteTeam, deleteUserAccount } from './team-storage.js';

let currentDeleteTeamId = null;

// Initialize auth UI
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
});

function initializeAuthUI() {
    // Profile icon click handler
    const profileIconBtn = document.getElementById('profile-icon-btn');
    if (profileIconBtn) {
        profileIconBtn.addEventListener('click', handleProfileIconClick);
    }

    // Login modal handlers
    const loginModal = document.getElementById('login-modal');
    const loginModalClose = document.getElementById('login-modal-close');
    const googleSigninBtn = document.getElementById('google-signin-btn');

    if (loginModalClose) {
        loginModalClose.addEventListener('click', () => hideModal('login-modal'));
    }

    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', handleGoogleSignIn);
    }

    // Profile modal handlers
    const profileModal = document.getElementById('profile-modal');
    const profileModalClose = document.getElementById('profile-modal-close');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    if (profileModalClose) {
        profileModalClose.addEventListener('click', () => hideModal('profile-modal'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => showModal('delete-account-modal'));
    }

    // Delete team modal handlers
    const deleteTeamModal = document.getElementById('delete-team-modal');
    const deleteTeamModalClose = document.getElementById('delete-team-modal-close');
    const confirmDeleteTeam = document.getElementById('confirm-delete-team');
    const cancelDeleteTeam = document.getElementById('cancel-delete-team');

    if (deleteTeamModalClose) {
        deleteTeamModalClose.addEventListener('click', () => hideModal('delete-team-modal'));
    }

    if (confirmDeleteTeam) {
        confirmDeleteTeam.addEventListener('click', handleConfirmDeleteTeam);
    }

    if (cancelDeleteTeam) {
        cancelDeleteTeam.addEventListener('click', () => hideModal('delete-team-modal'));
    }

    // Delete account modal handlers
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const deleteAccountModalClose = document.getElementById('delete-account-modal-close');
    const confirmDeleteAccount = document.getElementById('confirm-delete-account');
    const cancelDeleteAccount = document.getElementById('cancel-delete-account');
    const confirmEmailInput = document.getElementById('confirm-email-input');

    if (deleteAccountModalClose) {
        deleteAccountModalClose.addEventListener('click', () => hideModal('delete-account-modal'));
    }

    if (confirmDeleteAccount) {
        confirmDeleteAccount.addEventListener('click', handleConfirmDeleteAccount);
    }

    if (cancelDeleteAccount) {
        cancelDeleteAccount.addEventListener('click', () => hideModal('delete-account-modal'));
    }

    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', handleEmailInputChange);
    }

    // Close modals when clicking outside
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) hideModal('login-modal');
        });
    }

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) hideModal('profile-modal');
        });
    }

    if (deleteTeamModal) {
        deleteTeamModal.addEventListener('click', (e) => {
            if (e.target === deleteTeamModal) hideModal('delete-team-modal');
        });
    }

    if (deleteAccountModal) {
        deleteAccountModal.addEventListener('click', (e) => {
            if (e.target === deleteAccountModal) hideModal('delete-account-modal');
        });
    }

    // Listen for auth state changes
    onAuthStateChange((user) => {
        updateUIForAuthState(user);
    });
}

function handleProfileIconClick() {
    const user = getCurrentUser();
    if (user) {
        showProfileModal();
    } else {
        showModal('login-modal');
    }
}

async function handleGoogleSignIn() {
    const googleSigninBtn = document.getElementById('google-signin-btn');
    const loginError = document.getElementById('login-error');

    if (googleSigninBtn) {
        googleSigninBtn.disabled = true;
        googleSigninBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }

    if (loginError) {
        loginError.classList.add('hidden');
    }

    const result = await loginWithGoogle();
    
    if (result.success) {
        hideModal('login-modal');
        showProfileModal();
    } else {
        if (loginError) {
            loginError.textContent = result.error || 'Failed to sign in. Please try again.';
            loginError.classList.remove('hidden');
        }
    }

    if (googleSigninBtn) {
        googleSigninBtn.disabled = false;
        googleSigninBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google';
    }
}

async function handleLogout() {
    const result = await logout();
    if (result.success) {
        hideModal('profile-modal');
    }
}

function updateUIForAuthState(user) {
    // This will be called when auth state changes
    // Can be used to update UI elements that depend on auth state
}

async function showProfileModal() {
    const user = getCurrentUser();
    if (!user) {
        showModal('login-modal');
        return;
    }

    // Update profile info
    const profilePhoto = document.getElementById('profile-photo');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');

    if (profilePhoto) {
        profilePhoto.src = user.photoURL || 'https://via.placeholder.com/100?text=User';
        profilePhoto.alt = user.displayName || 'User';
    }

    if (profileName) {
        profileName.textContent = user.displayName || 'User';
    }

    if (profileEmail) {
        profileEmail.textContent = user.email || '';
    }

    // Load and display teams
    await loadAndDisplayTeams();

    showModal('profile-modal');
}

async function loadAndDisplayTeams() {
    const teamsList = document.getElementById('teams-list');
    if (!teamsList) return;

    try {
        const teams = await loadUserTeams();
        
        if (teams.length === 0) {
            teamsList.innerHTML = '<p class="no-teams">No saved teams yet</p>';
            return;
        }

        // Sort teams by creation date (newest first)
        teams.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
        });

        teamsList.innerHTML = teams.map(team => {
            const pokemonCount = team.pokemon.filter(p => p !== null).length;
            const generationNames = {
                1: 'Gen I', 2: 'Gen II', 3: 'Gen III', 4: 'Gen IV',
                5: 'Gen V', 6: 'Gen VI', 7: 'Gen VII', 8: 'Gen VIII', 9: 'Gen IX'
            };
            const genName = generationNames[team.generation] || `Gen ${team.generation}`;

            // Get Pokemon sprites for preview
            const pokemonPreviews = team.pokemon
                .filter(p => p !== null)
                .slice(0, 6)
                .map(p => `<img src="${p.sprites.front_default}" alt="${p.name}" class="team-preview-sprite" title="${p.name}">`)
                .join('');

            return `
                <div class="team-item" data-team-id="${team.teamId}">
                    <div class="team-item-header">
                        <div class="team-item-info">
                            <span class="team-generation-badge">${genName}</span>
                            <span class="team-pokemon-count">${pokemonCount} Pokemon</span>
                        </div>
                        <div class="team-item-actions">
                            <button class="btn-open-team" data-team-id="${team.teamId}">
                                <i class="fas fa-external-link-alt"></i> Open in Team Builder
                            </button>
                            <button class="btn-delete-team" data-team-id="${team.teamId}">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="team-preview">
                        ${pokemonPreviews || '<p class="no-pokemon-preview">No Pokemon in team</p>'}
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for team actions
        teamsList.querySelectorAll('.btn-open-team').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                openTeamInBuilder(teamId, teams);
            });
        });

        teamsList.querySelectorAll('.btn-delete-team').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const teamId = e.currentTarget.dataset.teamId;
                showDeleteTeamModal(teamId);
            });
        });

    } catch (error) {
        console.error('Error loading teams:', error);
        teamsList.innerHTML = '<p class="error-message">Error loading teams. Please try again.</p>';
    }
}

function openTeamInBuilder(teamId, teams) {
    const team = teams.find(t => t.teamId === teamId);
    if (!team) return;

    // Store team data in sessionStorage to load on team builder page
    sessionStorage.setItem('loadTeam', JSON.stringify({
        teamId: teamId,
        pokemon: team.pokemon,
        generation: team.generation
    }));

    // Navigate to team builder
    window.location.href = 'index.html';
}

function showDeleteTeamModal(teamId) {
    currentDeleteTeamId = teamId;
    showModal('delete-team-modal');
}

async function handleConfirmDeleteTeam() {
    if (!currentDeleteTeamId) return;

    try {
        await deleteTeam(currentDeleteTeamId);
        hideModal('delete-team-modal');
        
        // Reload teams list
        await loadAndDisplayTeams();
        
        currentDeleteTeamId = null;
    } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
    }
}

function handleEmailInputChange(e) {
    const user = getCurrentUser();
    const confirmDeleteBtn = document.getElementById('confirm-delete-account');
    const deleteAccountError = document.getElementById('delete-account-error');

    if (!user || !confirmDeleteBtn) return;

    const enteredEmail = e.target.value.trim().toLowerCase();
    const userEmail = user.email.toLowerCase();

    if (enteredEmail === userEmail) {
        confirmDeleteBtn.disabled = false;
        if (deleteAccountError) {
            deleteAccountError.classList.add('hidden');
        }
    } else {
        confirmDeleteBtn.disabled = true;
    }
}

async function handleConfirmDeleteAccount() {
    const user = getCurrentUser();
    const confirmEmailInput = document.getElementById('confirm-email-input');
    const deleteAccountError = document.getElementById('delete-account-error');
    const confirmDeleteBtn = document.getElementById('confirm-delete-account');

    if (!user || !confirmEmailInput) return;

    const enteredEmail = confirmEmailInput.value.trim().toLowerCase();
    const userEmail = user.email.toLowerCase();

    if (enteredEmail !== userEmail) {
        if (deleteAccountError) {
            deleteAccountError.textContent = 'Email does not match. Please try again.';
            deleteAccountError.classList.remove('hidden');
        }
        return;
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';
    }

    try {
        await deleteUserAccount();
        await logout();
        hideModal('delete-account-modal');
        alert('Account deleted successfully.');
    } catch (error) {
        console.error('Error deleting account:', error);
        if (deleteAccountError) {
            deleteAccountError.textContent = 'Failed to delete account. Please try again.';
            deleteAccountError.classList.remove('hidden');
        }
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Account';
        }
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Reset delete account modal
    if (modalId === 'delete-account-modal') {
        const confirmEmailInput = document.getElementById('confirm-email-input');
        const confirmDeleteBtn = document.getElementById('confirm-delete-account');
        const deleteAccountError = document.getElementById('delete-account-error');
        
        if (confirmEmailInput) confirmEmailInput.value = '';
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Delete Account';
        }
        if (deleteAccountError) deleteAccountError.classList.add('hidden');
    }

    // Reset delete team modal
    if (modalId === 'delete-team-modal') {
        currentDeleteTeamId = null;
    }
}

