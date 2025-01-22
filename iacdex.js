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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const fromBalanceElement = document.getElementById('fromBalance');
const toBalanceElement = document.getElementById('toBalance');
const priceElement = document.getElementById('price');
const lastUpdateElement = document.getElementById('lastUpdate');
const countdownElement = document.getElementById('countdown');
const fromNetworkSelect = document.getElementById('fromNetwork');
const toNetworkSelect = document.getElementById('toNetwork');
const swapButton = document.getElementById('swapButton');
const amountInput = document.getElementById('amount');
const connectWalletButton = document.getElementById('connectWalletButton');
const walletStatus = document.getElementById('walletStatus');
const networkSelect = document.getElementById('networkSelect');


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
    usdc_erc20: 'USDC',
    usdt_erc20: 'USDT',
};

// Rentang harga untuk setiap token
const priceRanges = {
    polygon: [0.45, 0.50],
    bsc: [700, 710],
    btc: [100000, 110000],
    eth: [3200, 3300],
    lido: [0.8, 0.5],
    steth: [3199, 3300],
    sol: [270, 280],
    jup: [0.7, 0.8],
    sui: [4.5, 5],
    ton: [5, 6],
    dogs: [0,00035, 0.00040],
    arb: [0.71, 0.81],
    weth: [3205, 3301],
    celestia: [4.8, 5.1],
    cardano: [1.1, 1.2],
    xrp: [2, 3],
    tron: [0.21, 0.25],
    usdc_erc20: [1, 1],
    usdt_erc20: [0.9999, 1],
};

// Fungsi untuk mendapatkan harga acak dari rentang yang ditentukan
function getRandomPrice(token) {
    const [min, max] = priceRanges[token];
    return (Math.random() * (max - min) + min).toFixed(15); // Menghasilkan harga acak dalam rentang yang ditentukan
}

// Fungsi untuk mengambil harga dari Firebase jika diperlukan
function fetchPrices() {
    Object.keys(priceRanges).forEach(token => {
        const priceRef = firebase.database().ref(`price/${fromNetwork}_to_${toNetwork}`);
        priceRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log(`Price for ${toNetwork}: $${data.price}`);
                // Update UI jika diperlukan
            } else {
                console.log(`No price data for ${token}`);
            }
        });
    });
}

// Fungsi untuk mengupdate harga
function updatePrice() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork && toNetwork) {
        if (fromNetwork === toNetwork) {
            alert('Cannot swap between the same network.');
            return;
        }

        const fromPrice = getRandomPrice(fromNetwork); // atau ambil dari sumber yang diinginkan
        const toPrice = getRandomPrice(toNetwork); // atau ambil dari sumber yang diinginkan

        if (toPrice !== '0') {
            const conversionRate = (fromPrice / toPrice).toFixed(6);
            priceElement.textContent = `Price : 1 ${tickerMap[fromNetwork]} =  ${conversionRate} ${tickerMap[toNetwork]}`;
            
            
            
            // Simpan harga token ke Firebase
            const priceRef = firebase.database().ref(`price/${fromNetwork}_to_${toNetwork}`);
            priceRef.set({
                fromPrice: fromPrice,
                toPrice: toPrice,
                conversionRate: conversionRate,
                timestamp: new Date().toISOString()
            })
            const amount = parseFloat(amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                const estimatedAmount = (amount * conversionRate).toFixed(10);
                // Tampilkan estimasi di elemen yang sesuai
                document.getElementById('estimatedAmount').textContent = `Estimated: ${estimatedAmount} ${tickerMap[toNetwork]}`;
            } else {
                document.getElementById('estimatedAmount').textContent = `Estimated: N/A`;
            }
        } else {
            priceElement.textContent = `Price: N/A`;
        }

        // Update waktu terakhir di-update
        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        lastUpdateElement.textContent = `Last Updated: ${formattedTime}`;
    }
}

// Function to update balances
function updateBalances() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    // Jika user tidak terautentikasi, sembunyikan saldo
    if (!userId) {
        fromBalanceElement.textContent = 'Sell: N/A';
        toBalanceElement.textContent = 'Buy: N/A';
        return; // Keluar dari fungsi jika user tidak terautentikasi
    }

    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    if (fromNetwork) {
        const fromBalanceRef = database.ref(`wallets/${userId}/${fromNetwork}/balance`);
        fromBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            fromBalanceElement.textContent = `You're Selling ${balance} ${tickerMap[fromNetwork]}`;
        });
    }

    if (toNetwork) {
        const toBalanceRef = database.ref(`wallets/${userId}/${toNetwork}/balance`);
        toBalanceRef.on('value', snapshot => {
            const balance = snapshot.val() || 0;
            toBalanceElement.textContent = `You're Buying ${balance} ${tickerMap[toNetwork]}`;
        });
    }
}

// Function to handle countdown
let countdown = 10;
function startCountdown() {
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = `Next price update in: ${countdown}s`;
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
            updatePrice();  // Update price and estimated amount after countdown ends
            updateGasFee();
            countdown = 10; // Reset countdown
            startCountdown(); // Restart countdown
        }
    }, 1000);
}

// Event listener untuk fromNetworkSelect
fromNetworkSelect.addEventListener('change', () => {
    // Ambil nilai dari fromNetworkSelect dan toNetworkSelect
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    // Jika fromNetwork dan toNetwork sama, maka otomatis ganti toNetwork
    if (fromNetwork === toNetwork) {
        // Cari network yang berbeda dari pilihan saat ini di toNetwork
        for (let option of toNetworkSelect.options) {
            if (option.value !== fromNetwork) {
                toNetworkSelect.value = option.value;
                break;
            }
        }
    }

    // Update saldo dan harga setelah perubahan
    updateBalances();
    updatePrice();
    updateEstimatedAmount();
});

toNetworkSelect.addEventListener('change', () => {
    const toNetwork = toNetworkSelect.value;
    const fromNetwork = fromNetworkSelect.value;

    // Jika fromNetwork dan toNetwork sama, maka otomatis ganti toNetwork
    if (toNetwork === fromNetwork) {
        // Cari network yang berbeda dari pilihan saat ini di toNetwork
        for (let option of toNetworkSelect.options) {
            if (option.value !== toNetwork) {
                fromNetworkSelect.value = option.value;
                break;
            }
        }
    }

    // Update saldo dan harga setelah perubahan
    updateBalances();
    updatePrice();
    updateEstimatedAmount();
});

amountInput.addEventListener('input', () => {
    updateEstimatedAmount();
});

function connectWallet() {
    const user = firebase.auth().currentUser;

    if (user) {
        const userId = user.uid;
        const selectedNetwork = networkSelect.value; // Get selected network

        const addressRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/address`);

        addressRef.once('value').then(snapshot => {
            const address = snapshot.val() || 'N/A'; // Default to 'N/A' if no address found
            networkAddress.textContent = `Network Address: ${address}`;
        });

        walletStatus.textContent = 'Connected';
        walletStatus.style.color = 'green';

        // Tampilkan elemen swap setelah wallet terhubung
        document.getElementById('swapSection').style.display = 'block';
        
        // Alert saat wallet terhubung
        alert('Wallet telah terhubung!');
        updateBalances(); // Update saldo setelah terhubung
    } else {
        walletStatus.textContent = 'Not Connected';
        walletStatus.style.color = 'red';
        networkAddress.textContent = 'Network Address: N/A';
        // Sembunyikan elemen swap jika wallet tidak terhubung
        document.getElementById('swapSection').style.display = 'none';
    }
}

// Swap button click handler
swapButton.addEventListener('click', () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount.');
        return;
    }

    if (fromNetwork === toNetwork) {
        alert('Cannot swap between the same network.');
        return;
    }

    const fromBalanceRef = database.ref(`wallets/${auth.currentUser.uid}/${fromNetwork}/balance`);
    const gasFeeRef = database.ref(`gasprice/${fromNetwork}/gasFee`);

    gasFeeRef.once('value').then(gasSnapshot => {
        const gasFee = parseFloat(gasSnapshot.val()) || 0;

        fromBalanceRef.once('value').then(snapshot => {
            const fromBalance = snapshot.val() || 0;

            // Pengecekan saldo sebelum konfirmasi
            if (fromBalance < amount + gasFee) {
                alert('Insufficient balance to cover the swap and gas fee.');
                return; // Batalkan jika saldo tidak cukup
            }

            // Alert untuk konfirmasi swap
            const confirmMessage = `You are about to swap ${amount} ${tickerMap[fromNetwork]} with a gas fee of ${gasFee} ${tickerMap[fromNetwork]}. Do you want to proceed?`;
            if (!confirm(confirmMessage)) {
                alert('Swap canceled.');
                return; // Batalkan jika pengguna memilih tidak
            }

            const fromPrice = parseFloat(getRandomPrice(fromNetwork));
            const toPrice = parseFloat(getRandomPrice(toNetwork));
            const amountInToNetwork = amount * (fromPrice / toPrice);
            const toBalanceRef = database.ref(`wallets/${auth.currentUser.uid}/${toNetwork}/balance`);

            toBalanceRef.once('value').then(toSnapshot => {
                const toBalance = toSnapshot.val() || 0;
                const newToBalance = toBalance + amountInToNetwork;
                const newFromBalance = fromBalance - amount - gasFee;

                // Update balances
                fromBalanceRef.set(newFromBalance).then(() => {
                    toBalanceRef.set(newToBalance).then(() => {
                        alert('Swap successful!');
                        updateBalances();
                        const transactionHash = generateTransactionHash();
                        const transactionRef = firebase.database().ref(`transactions/allnetwork/${transactionHash}`);
                        const timestamp = new Date().toISOString();
                        const transactionData = {
                          
                            network: `${fromNetwork} to ${toNetwork}`,
                            sender: auth.currentUser.uid,
                            recipient: auth.currentUser.uid,
                            amount: amount.toFixed(6),
                            gasFee: gasFee.toFixed(6),
                            price: fromPrice.toFixed(2),
                            timestamp: timestamp,
                            transactionHash: transactionHash,
                            type: 'swap'
                        };
                        const updates = {};
                        updates[`/transactions/allnetwork/${transactionHash}`] = transactionData;
                        database.ref().update(updates);
                    }).catch(error => {
                        console.error('Error updating to balance:', error);
                    });
                }).catch(error => {
                    console.error('Error updating from balance:', error);
                });
            }).catch(error => {
                console.error('Error fetching to balance:', error);
            });
        }).catch(error => {
            console.error('Error fetching from balance:', error);
        });
    }).catch(error => {
        console.error('Error fetching gas fee:', error);
    });
});

// Start countdown and price update every 5 seconds
startCountdown();

// Function to update estimated amount based on the input amount
function updateEstimatedAmount() {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;
    const amount = parseFloat(amountInput.value);

    if (fromNetwork && toNetwork && !isNaN(amount) && amount > 0) {
        const fromPrice = parseFloat(getRandomPrice(fromNetwork));
        const toPrice = parseFloat(getRandomPrice(toNetwork));

        if (toPrice > 0) {
            const estimatedAmount = (amount * (fromPrice / toPrice)).toFixed(15); // Menggunakan 6 desimal
            document.getElementById('estimatedAmount').textContent = `Estimated: ${estimatedAmount} ${tickerMap[toNetwork]}`; // Update teks estimasi
        } else {
            document.getElementById('estimatedAmount').textContent = "Estimated: N/A";
        }
    } else {
        document.getElementById('estimatedAmount').textContent = "Estimated: N/A";
    }
}

// Tambahkan event listener ke amountInput untuk menghitung estimasi saat pengguna mengetikkan jumlah
amountInput.addEventListener('input', updateEstimatedAmount);


// Connect Wallet functionality
connectWalletButton.addEventListener('click', () => {
    connectWallet();
    
    connectWalletButton.style.display = 'none';
    
});

// Update address when network changes
networkSelect.addEventListener('change', () => {
    connectWallet(); // Update wallet info on network change
});

// Function to update gas fee with ticker
function updateGasFee() {
    const selectedNetwork = fromNetworkSelect.value; // Mengambil network yang dipilih untuk swap

    // Referensi ke path gas fee di Firebase berdasarkan network yang dipilih
    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);

    gasFeeRef.once('value')
        .then(snapshot => {
            const gasFee = parseFloat(snapshot.val()) || 0; // Mengambil gas fee dari Firebase
            const ticker = tickerMap[selectedNetwork] || ''; // Mendapatkan ticker berdasarkan network

            // Tampilkan gas fee dengan ticker
            document.getElementById('gasFee').textContent = `${gasFee.toFixed(6)} ${ticker}`;
        })
        .catch(error => {
            console.error('Error fetching gas fee:', error);
            document.getElementById('gasFee').textContent = 'N/A'; // Jika error, tampilkan N/A
        });
}

// Event listener untuk update gas fee ketika network berubah
fromNetworkSelect.addEventListener('change', updateGasFee);
toNetworkSelect.addEventListener('change', updateGasFee);

// Panggil updateGasFee pertama kali saat halaman dimuat
updateGasFee();

autoSwitchButton.addEventListener('click', () => {
    const fromNetwork = fromNetworkSelect.value;
    const toNetwork = toNetworkSelect.value;

    // Cek jika dariNetwork dan toNetwork ada
    if (fromNetwork && toNetwork) {
        // Tukar pilihan jaringan
        fromNetworkSelect.value = toNetwork;
        toNetworkSelect.value = fromNetwork;

        // Perbarui saldo setelah mengganti jaringan
        updateBalances();
        updateGasFee();
    } else {
        alert('Please select both networks before switching.');
    }
});

    networkSelect.addEventListener('change', () => {
        const selectedNetwork = networkSelect.value;

        // Reset options
        fromNetworkSelect.innerHTML = '';

        // Menambahkan opsi berdasarkan pilihan jaringan yang dipilih
        for (const [value, name] of Object.entries(allNetworks)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = name;
            fromNetworkSelect.appendChild(option);
        }

        // Set nilai fromNetwork ke yang dipilih di networkSelect
        fromNetworkSelect.value = selectedNetwork;
    });
    
// Fungsi untuk membuat hash transaksi acak (untuk simulasi)
function generateTransactionHash() {
    const chars = 'abcdef0123456789-';
    let hash = '';
    for (let i = 0; i < 64; i++) { // Panjang hash 64 karakter (mirip dengan hash blockchain sebenarnya)
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}
