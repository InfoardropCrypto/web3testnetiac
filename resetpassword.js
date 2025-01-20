// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWjQFrRDZbfVWUdBwyv2GCMiTCJhixv68",
    authDomain: "web3-wallet-2fb31.firebaseapp.com",
    databaseURL: "https://web3-wallet-2fb31-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web3-wallet-2fb31",
    storageBucket: "web3-wallet-2fb31.appspot.com",
    messagingSenderId: "653013977555",
    appId: "1:653013977555:web:dd205cc11dcf787edc8726",
    measurementId: "G-3T27KLCRGJ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM elements
const changePasswordButton = document.getElementById('changePasswordButton');
const emailInput = document.getElementById('email');
const oldPasswordInput = document.getElementById('oldPassword');
const newPasswordInput = document.getElementById('newPassword');
const resetMessage = document.getElementById('resetMessage');
const resetSuccess = document.getElementById('resetSuccess');
const toggleOldPassword = document.getElementById('toggleOldPassword');
const toggleNewPassword = document.getElementById('toggleNewPassword');

// Toggle password visibility
toggleOldPassword.addEventListener('click', () => {
    const type = oldPasswordInput.type === 'password' ? 'text' : 'password';
    oldPasswordInput.type = type;
    toggleOldPassword.textContent = type === 'password' ? '👁️' : '👁️';
});

toggleNewPassword.addEventListener('click', () => {
    const type = newPasswordInput.type === 'password' ? 'text' : 'password';
    newPasswordInput.type = type;
    toggleNewPassword.textContent = type === 'password' ? '👁️' : '👁️';
});

// Check user authentication state
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User logged in:', user.email);
        emailInput.value = user.email;
    } else {
        console.log('No user logged in');
        resetMessage.textContent = 'Anda harus login untuk mereset password.';
        resetSuccess.textContent = '';
        // Disable the form inputs
        emailInput.disabled = true;
        oldPasswordInput.disabled = true;
        newPasswordInput.disabled = true;
        changePasswordButton.disabled = true;
    }
});

// Change Password functionality
changePasswordButton.addEventListener('click', () => {
    const email = emailInput.value;
    const oldPassword = oldPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const user = auth.currentUser;

    if (!email || !oldPassword || !newPassword) {
        resetMessage.textContent = 'Email, sandi lama, dan sandi baru harus diisi.';
        resetSuccess.textContent = '';
        return;
    }

    if (!user) {
        resetMessage.textContent = 'Pengguna belum login.';
        resetSuccess.textContent = '';
        return;
    }

    if (user.email !== email) {
        resetMessage.textContent = 'Email tidak cocok dengan pengguna yang sedang login.';
        resetSuccess.textContent = '';
        return;
    }

    // Re-authenticate the user with the old password
    const credential = firebase.auth.EmailAuthProvider.credential(email, oldPassword);
    
    user.reauthenticateWithCredential(credential).then(() => {
        // Sandi lama benar, lakukan perubahan sandi
        return user.updatePassword(newPassword);
    }).then(() => {
        resetSuccess.textContent = 'Password berhasil diganti untuk email: ' + email;
        resetMessage.textContent = '';
    }).catch(error => {
        resetMessage.textContent = error.message;
        resetSuccess.textContent = '';
    });
});
