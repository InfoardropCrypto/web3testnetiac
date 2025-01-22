const firebaseConfig = {
    apiKey: "AIzaSyCtvxvFSXOT0fkRpl84U6LTD8xg8rGWrV8",
    authDomain: "web3-iac-wallet.firebaseapp.com",
    databaseURL: "https://web3-iac-wallet-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web3-iac-wallet",
    storageBucket: "web3-iac-wallet.firebasestorage.app",
    messagingSenderId: "462702808978",
    appId: "1:462702808978:web:843402ceb14d9eb026bb4b",
    measurementId: "G-H8W6VMJJPH"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const userIdElement = document.getElementById('userId');
const cryptoBalanceElement = document.getElementById('cryptoBalance');
const cryptoAddressElement = document.getElementById('cryptoAddress');
const sendCryptoButton = document.getElementById('sendCrypto');
const sendToAddressInput = document.getElementById('sendToAddress');
const sendAmountInput = document.getElementById('sendAmount');
const signInSubmit = document.getElementById('signInSubmit');
const signUpSubmit = document.getElementById('signUpSubmit');
const showSignUpForm = document.getElementById('showSignUpForm');
const showSignInForm = document.getElementById('showSignInForm');
const signInError = document.getElementById('signInError');
const signUpError = document.getElementById('signUpError');
const walletContainer = document.getElementById('walletContainer');
const authContainer = document.getElementById('authContainer');
const signOutButton = document.getElementById('signOutButton');
const networkSelect = document.getElementById('networkSelect');
const gasFeeElement = document.getElementById('gasFee');
const tickerElement = document.getElementById('ticker');
const memoInput = document.getElementById('memo');
const tokenBalanceElement = document.getElementById('tokenBalance');
document.getElementById('searchInput').addEventListener('input', function() {
            var filter = this.value.toLowerCase();
            var options = document.getElementById('networkSelect').options;
            var found = false;

            for (var i = 0; i < options.length; i++) {
                var optionText = options[i].text.toLowerCase();
                if (optionText.indexOf(filter) > -1) {
                    options[i].style.display = ""; // Tampilkan opsi yang sesuai
                    if (!found && filter.length > 0) {
                        options[i].selected = true; // Pilih opsi pertama yang cocok
                        found = true;
                    }
                } else {
                    options[i].style.display = "none"; // Sembunyikan opsi yang tidak cocok
                }
            }
        });

        // Fungsi untuk mengaktifkan pilihan otomatis ketika pengguna menekan Enter
        document.getElementById('searchInput').addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                var selectElement = document.getElementById('networkSelect');
                var selectedOption = selectElement.options[selectElement.selectedIndex];
                // Otomatis 'klik' dropdown jika opsi yang cocok sudah dipilih
                alert('Crypto selected: ' + selectedOption.text);
                selectElement.dispatchEvent(new Event('change')); // Trigger change event jika diperlukan
            }
        });
// Display wallet or authentication UI based on user state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        walletContainer.style.display = 'block';
        userIdElement.textContent = user.uid; // Set the User ID
        updateWallet();
        startGasFeeSync();
    } else {
        authContainer.style.display = 'block';
        walletContainer.style.display = 'none';
    }
});

function updateTokenBalance() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);

    balanceRef.on('value', snapshot => {
        const balance = snapshot.val() || 0;
        tokenBalanceElement.textContent = `Token Balance: ${balance}`;
    });
}

// Define ticker map
const tickerMap = {
    polygon: 'POL',
    bsc: 'BSC',
    btc: 'BTC',
    eth: 'ETH',
    lido: 'LDO',
    steth: 'stETH',
    sol: 'SOL',
    jup: 'JUP',
    sui: 'SUI',
    ton: 'TON',
    dogs: 'DOGS',
    arb: 'ARB',
    weth: 'ETH',
    celestia: 'TIA',
    cardano: 'ADA',
    xrp: 'XRP',
    tron: 'TRX',
    usdt_erc20: 'USDT',
    usdc_erc20: 'USDC',
};

// Define gas fee range
const gasFeeRanges = {
    polygon: [0.0005, 0.0015],
    bsc: [0.0005, 0.0020],
    btc: [0.0000777, 0.00005],
    eth: [0.0005, 0.0001],
    lido: [0.8, 0.5],
    steth: [0.0005, 0.0001],
    sol: [0.0005, 0.0001],
    jup: [0.00234, 0.00123],
    sui: [0.005, 0.0001],
    ton: [0.05, 0.001],
    dogs: [0,05, 0.001],
    arb: [0.000001, 0.00001],
    weth: [0.005, 0.0001],
    celestia: [0.007, 0.0002],
    cardano: [0.3,0.2],
    xrp: [0.01, 0.001],
    tron: [1, 2],
    usdt_erc20: [0.01, 0.1],
    usdc_erc20: [0.01, 0.1],
};

// Fungsi untuk mendapatkan gas fee acak dalam rentang yang ditentukan
function getRandomGasFee(network) {
    const [min, max] = gasFeeRanges[network];
    return (Math.random() * (max - min) + min).toFixed(5);
}

// Display wallet or authentication UI based on user state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        walletContainer.style.display = 'block';
        updateWallet();
        startGasFeeSync();
    } else {
        authContainer.style.display = 'block';
        walletContainer.style.display = 'none';
    }
});

// Show sign up form
showSignUpForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
});

// Show sign in form
showSignInForm.addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'block';
    document.getElementById('signUpForm').style.display = 'none';
});

// Sign Up
// Pastikan validasi untuk input email dan password
signUpSubmit.addEventListener('click', () => {
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    
    if (!validateEmail(email)) {
        signUpError.textContent = 'Invalid email address.';
        return;
    }
    
    if (password.length < 6) {
        signUpError.textContent = 'Password must be at least 6 characters long.';
        return;
    }
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Sign up successful');
        })
        .catch(error => {
            signUpError.textContent = error.message;
        });
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}


// Sign In
signInSubmit.addEventListener('click', () => {
    const email = document.getElementById('signInEmail').value;
    const password = document.getElementById('signInPassword').value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Sign in successful');
        })
        .catch(error => {
            signInError.textContent = error.message;
        });
});

// Sign Out
signOutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
        console.log('Sign out successful');
        stopGasFeeSync(); // Stop syncing when signed out
    }).catch(error => {
        console.error('Sign out error:', error);
    });
});

function updateWallet() {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;

    const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/address`);
    const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);

    // Update Address
    addressRef.once('value').then(snapshot => {
        let address = snapshot.val();
        if (!address) {
            address = generateRandomAddress(selectedNetwork);
            addressRef.set(address);
        }
        cryptoAddressElement.textContent = address;
    });

// Update Balance
balanceRef.on('value', snapshot => {
    let balance = snapshot.val() || 0;
    
    // Ubah format balance menjadi 1 angka di belakang desimal dengan pemisah ribuan
    balance = parseFloat(balance).toLocaleString('en-US', { 
        minimumFractionDigits: 10, 
        maximumFractionDigits: 10, 
        useGrouping: true 
    });
    
    const ticker = tickerMap[selectedNetwork];
    cryptoBalanceElement.textContent = `Balance: ${balance} ${ticker}`;
    tokenBalanceElement.textContent = `Token Balance: ${balance}`;
});

    // Update Gas Fee
    gasFeeRef.on('value', snapshot => {
        const gasFee = snapshot.val() || getRandomGasFee(selectedNetwork);
        gasFeeRef.set(gasFee);
        gasFeeElement.textContent = `${gasFee} ${tickerMap[selectedNetwork]}`;
    });
}

function generateRandomAddress(network) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = '';
    
    if (network === 'btc') {
        address = '1' + generateRandomChars(34); // Bitcoin addresses start with 1
    } else if (network === 'sol' || network === 'jup' || network === 'usdc_sol' || network === 'usdt_sol') {
        if (!localStorage.getItem('solana')) {
            // Generate and store a new address if not already present
            address = '' + generateRandomChars(32); // Panjang 32 karakter
            localStorage.setItem('solana', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('solana');
        }
    }  else if (network === 'sui') {
        address = '0x' + generateRandomChars(64); // Example length for Sui
    } else if (network === 'ton' || network === 'dogs') {
        if (!localStorage.getItem('tonnetwork')) {
            // Generate and store a new address if not already present
            address = 'UQ' + generateRandomChars(46); // Panjang 46 karakter
            localStorage.setItem('tonnetwork', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('tonnetwork');
        }
    } else if (network === 'xrp' ) {
        if (!localStorage.getItem('xrpnetwork')) {
            // Generate and store a new address if not already present
            address = 'r' + generateRandomChars(35);
            localStorage.setItem('xrpnetwork', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('xrpnetwork');
        }
    } else if (network === 'celestia') {
        address = 'celestia' + generateRandomChars(39); // Example length for Celestia
    } else if (network === 'cardano') {
        address = 'addr1' + generateRandomChars(99); // Example length for Celestia
    } else if (network === 'tron' || network === 'usdt_trc20') {
        // Generate a common address for both TRON and USDT TRC20
        if (!localStorage.getItem('trc20')) {
            // Generate and store a new address if not already present
            address = 'TP' + generateRandomChars(34); // Panjang 34 karakter untuk TRON dan USDT TRC20
            localStorage.setItem('trc20', address);
        } else {
            // Retrieve the existing address
            address = localStorage.getItem('trc20');
        }
    } else {
        // Single address for all EVM networks
        address = localStorage.getItem('evmAddress');
        if (!address) {
            address = '0x' + generateRandomChars(40); // EVM addresses start with 0x
            localStorage.setItem('evmAddress', address);
        }
    }
    
    return address;
}

function generateRandomChars(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

sendCryptoButton.addEventListener('click', () => {
    const userId = firebase.auth().currentUser.uid;
    const selectedNetwork = networkSelect.value;
    const recipientAddress = sendToAddressInput.value.trim();
    const amount = parseFloat(sendAmountInput.value);
    const userAddress = cryptoAddressElement.textContent.trim();
    const memo = memoInput.value.trim();

    if (recipientAddress === userAddress) {
        alert('You cannot send crypto to yourself.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount.');
        return;
    }

    // Ambil saldo pengirim dan biaya gas
    const userBalanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);
    const gasFee = parseFloat(gasFeeElement.textContent.split(' ')[0]) || 0;
    const totalCost = amount + gasFee;

    userBalanceRef.once('value').then(snapshot => {
        const currentBalance = snapshot.val() || 0;

        if (currentBalance >= totalCost) {
            // Kurangi saldo pengirim
            userBalanceRef.set(currentBalance - totalCost).then(() => {
                // Tambah saldo penerima
                const recipientRef = firebase.database().ref(`wallets/${recipientAddress}/${selectedNetwork}/balance`);
                recipientRef.once('value').then(snapshot => {
                    const recipientBalance = snapshot.val() || 0;
                    recipientRef.set(recipientBalance + amount).then(() => {
                        // Simpan transaksi
                        const transactionHash = generateTransactionHash();
                        const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);

                        const transactionData = {
                            network: selectedNetwork,
                            sender: userAddress,
                            recipient: recipientAddress,
                            amount: amount,
                            gasFee: gasFee,
                            memo: memo,  // Include memo
                            timestamp: new Date().toISOString()
                        };

                        transactionRef.set(transactionData).then(() => {
                            const explorerUrl = generateExplorerUrl(selectedNetwork, transactionHash);
                            alert(`Crypto sent successfully! You can view the transaction at: ${explorerUrl}`);
                        });
                    });
                });
            });
        } else {
            alert('Insufficient balance to cover the transaction and gas fee.');
        }
    }).catch(error => {
        console.error('Error fetching balance:', error);
    });
});

// Fungsi untuk membuat hash transaksi acak (untuk simulasi)
function generateTransactionHash() {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) { // Panjang hash 64 karakter (mirip dengan hash blockchain sebenarnya)
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

function generateExplorerUrl(network, transactionHash) {
    let baseUrl;

    switch (network) {
        case 'eth':
            baseUrl = 'https://etherscan.io/tx/';
            break;
        case 'bsc':
            baseUrl = 'https://bscscan.com/tx/';
            break;
        case 'polygon':
            baseUrl = 'https://polygonscan.com/tx/';
            break;
        case 'btc':
            baseUrl = 'https://www.blockchain.com/btc/tx/';
            break;
        case 'sol':
            baseUrl = 'https://explorer.solana.com/tx/';
            break;
        case 'sui':
            baseUrl = 'https://explorer.sui.com/tx/';
            break;
        default:
            baseUrl = '#';
    }

    return `${baseUrl}${transactionHash}`;
}

// Change network
networkSelect.addEventListener('change', () => {
    updateWallet();
});

// Track and update gas fee every 3 seconds
let gasFeeInterval;

function startGasFeeSync() {
    gasFeeInterval = setInterval(() => {
        const selectedNetwork = networkSelect.value;
        const gasFeeRef = firebase.database().ref(`gasprice/${selectedNetwork}/gasFee`);
        gasFeeRef.set(getRandomGasFee(selectedNetwork));
    }, 10000); // Update every 10 seconds
}

function stopGasFeeSync() {
    clearInterval(gasFeeInterval);
}

document.addEventListener("DOMContentLoaded", function () {
            const selectElement = document.getElementById("networkSelect");
            const networkIcon = document.getElementById("networkIcon");

            // Set default image based on the initial selection
            networkIcon.src = selectElement.options[selectElement.selectedIndex].getAttribute('data-image');

            selectElement.addEventListener('change', function () {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                const imgSrc = selectedOption.getAttribute('data-image');
                
                if (imgSrc) {
                    networkIcon.src = imgSrc;
                }
            });
        });
        // Function to toggle password visibility
        function togglePassword(id, button) {
            const passwordInput = document.getElementById(id);
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            button.innerHTML = type === 'password' ? '🙉' : '🙈';
        }
//Code By Mhsr
