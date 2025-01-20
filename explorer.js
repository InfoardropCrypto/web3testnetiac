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
const database = firebase.database();

// DOM elements
const transactionsContainer = document.getElementById('transactionsContainer');
const searchInput = document.getElementById('searchInput');
const totalTransactionsElement = document.getElementById('totalTransactions');
const dailyTransactionsElement = document.getElementById('dailyTransactions');
const totalGasFeeElement = document.getElementById('totalGasFee');
const networkDetailsElement = document.getElementById('networkDetails');
const pendingBlocksContainer = document.getElementById('pendingBlocks');
const confirmedBlocksContainer = document.getElementById('confirmedBlocks');

// Menghasilkan ID unik untuk setiap blok
let blockCounter = 0;
let isListeningForTransactions = false; // Penanda untuk mencegah mendengarkan berulang

// Fungsi untuk membuat elemen blok dengan detail transaksi
function createBlockElement(transaction, isConfirmed = false) {
    const blockElement = document.createElement('div');
    blockElement.className = `block ${isConfirmed ? 'confirmed-block' : 'pending-block'}`;
    blockElement.id = `block-${blockCounter++}`;
    
    // Mendapatkan waktu dalam format lokal
    const date = new Date(transaction.timestamp);
    const formattedTime = date.toLocaleTimeString();

    blockElement.innerHTML = `
        <p>Tx Hash: ${transaction.txId}</p>
        <p>Amount: ${transaction.amount} </p>
        <p>Time: ${formattedTime}</p>
        <p>Status: ${isConfirmed ? 'Confirmed' : 'Pending'}</p>
    `;
    return blockElement;
}

// Menambahkan blok ke bagian pending dan mengatur untuk dikonfirmasi setelah 20 detik
function addPendingBlock(transaction) {
    // Cek apakah txId sudah ada di confirmed
    const confirmedRef = database.ref('blocks/confirmed');
    confirmedRef.once('value', snapshot => {
        let txExists = false;

        // Cek setiap blok konfirmasi
        snapshot.forEach(childSnapshot => {
            const block = childSnapshot.val();
            if (block.txId === transaction.txId) {
                txExists = true; // Jika txId sudah ada, tandai
            }
        });

        // Jika txId tidak ada di confirmed, tambahkan ke pending
        if (!txExists) {
            const blockElement = createBlockElement(transaction);
            pendingBlocksContainer.appendChild(blockElement);

            // Simpan blok pending di Firebase
            const newBlockRef = database.ref('blocks/pending').push();
            newBlockRef.set({
                txId: transaction.txId,
                amount: transaction.amount,
                timestamp: Date.now() // Menyimpan timestamp saat blok ditambahkan
            });

            // Pindahkan ke bagian konfirmasi setelah 20 detik (20.000 ms)
            setTimeout(() => {
                confirmBlock(blockElement, newBlockRef);
            }, 20000); // 20 detik dalam milidetik
        }
    });
}

// Memindahkan blok ke bagian konfirmasi
function confirmBlock(blockElement, blockRef) {
    blockElement.classList.remove('pending-block');
    blockElement.classList.add('confirmed-block');
    blockElement.style.animation = 'moveToConfirmed 1s forwards';

    // Simpan blok ke bagian confirmed di Firebase
    blockRef.once('value', snapshot => {
        const blockData = snapshot.val();
        const confirmedBlockRef = database.ref('blocks/confirmed').push();
        confirmedBlockRef.set(blockData);

        // Hapus blok dari pending di Firebase setelah dikonfirmasi
        blockRef.remove(); // Menghapus blok dari pending setelah dikonfirmasi
    });

    // Delay untuk mencocokkan durasi animasi
    setTimeout(() => {
        // Menghapus blok dari pending
        pendingBlocksContainer.removeChild(blockElement);
        // Menambahkan blok ke confirmed
        confirmedBlocksContainer.appendChild(blockElement);
    }, 1000); // Delay untuk animasi
}

// Mengambil dan menampilkan blok yang sudah dikonfirmasi dari Firebase saat halaman dimuat
function loadConfirmedBlocks() {
    const confirmedRef = database.ref('blocks/confirmed');
    confirmedRef.on('child_added', snapshot => {
        const block = snapshot.val();
        const blockElement = createBlockElement({
            txId: block.txId,
            amount: block.amount,
            timestamp: block.timestamp // Menyimpan timestamp dari blok yang dikonfirmasi
        }, true);
        confirmedBlocksContainer.appendChild(blockElement);
    });
}

// Mendengarkan transaksi baru hanya sekali
function listenForNewTransactions() {
    if (isListeningForTransactions) return; // Cek apakah sudah mendengarkan
    isListeningForTransactions = true; // Tandai bahwa sudah mulai mendengarkan

    const transactionsRef = database.ref('transactions/allnetwork');

    // Mendengarkan untuk anak baru yang ditambahkan ke jalur "transactions"
    transactionsRef.on('child_added', snapshot => {
        const transaction = snapshot.val();
        addPendingBlock({
            txId: snapshot.key,
            amount: transaction.amount,
            timestamp: Date.now() // Menyimpan timestamp saat blok ditambahkan
        });
    }, error => {
        console.error("Error fetching transactions:", error);
    });
}

// Memuat transaksi saat autentikasi
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadConfirmedBlocks();  // Memuat blok yang sudah dikonfirmasi
        listenForNewTransactions();
    }
});


// Function to filter transactions based on search query
function filterTransactions(query, transactions) {
    return Object.keys(transactions).filter(transactionId => {
        const transaction = transactions[transactionId];
        
        // Convert values to string and then apply toLowerCase
        const transactionIdStr = transactionId.toLowerCase();
        const networkStr = (transaction.network || '').toLowerCase();
        const senderStr = (transaction.sender || '').toLowerCase();
        const recipientStr = (transaction.recipient || '').toLowerCase();
        const amountStr = (transaction.amount || '').toString().toLowerCase();
        const memoStr = (transaction.memo || '').toString().toLowerCase();
        const gasFeeStr = (transaction.gasFee || '').toString().toLowerCase();
        const timestampStr = (transaction.timestamp || '').toLowerCase();
        
        return (
            transactionIdStr.includes(query) ||
            networkStr.includes(query) ||
            senderStr.includes(query) ||
            recipientStr.includes(query) ||
            amountStr.includes(query) ||
            memoStr.includes(query) ||
            gasFeeStr.includes(query) ||
            timestampStr.includes(query)
        );
    }).reduce((filtered, transactionId) => {
        filtered[transactionId] = transactions[transactionId];
        return filtered;
    }, {});
}

// Function to display transactions
function displayTransactions(transactions) {
    if (transactionsContainer) {
        transactionsContainer.innerHTML = ''; // Clear previous transactions
    }

    let totalTransactions = 0;
    let dailyTransactions = 0;
    let totalGasFee = 0;
    let networkTotals = {};

    if (transactions && Object.keys(transactions).length > 0) {
        // Sort transactions by timestamp in descending order
        const sortedTransactionIds = Object.keys(transactions).sort((a, b) => {
            return new Date(transactions[b].timestamp) - new Date(transactions[a].timestamp);
        });

        sortedTransactionIds.forEach(transactionId => {
            const transaction = transactions[transactionId];
            const explorerUrl = generateExplorerUrl(transaction.network, transaction.transactionHash);
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction';
            transactionElement.innerHTML = `
                <p><strong>Tx hash:</strong> <span class="long-text">${transactionId}</span></p>
                <p><strong>Type:</strong> ${transaction.type === 'swap' ? 'swap' : 'send crypto'}</p>
                <p><strong>Source:</strong> ${transaction.network}</p>
                <p><strong>Sender:</strong> ${transaction.sender} </p>
                <p><strong>Recipient:</strong> ${transaction.recipient}</p>
                <p><strong>Value:</strong> ${transaction.amount}</p>
                <p><strong>Memo:</strong> ${transaction.memo}</p>
                <p><strong>Gas fee:</strong> ${transaction.gasFee}</p>
                <p><strong>Success : </strong>true</p>
                <p><strong>Time:</strong> ${new Date(transaction.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ${new Date(transaction.timestamp).toLocaleDateString('en-GB')}</p>
                <hr>
            `;
            transactionsContainer.appendChild(transactionElement);

            // Update totals
            totalTransactions++;
            const transactionDate = new Date(transaction.timestamp).toDateString();
            const today = new Date().toDateString();
            if (transactionDate === today) {
                dailyTransactions++;
            }
            totalGasFee += parseFloat(transaction.gasFee) || 0;

            // Update network totals
            const network = transaction.network;
            if (!networkTotals[network]) {
                networkTotals[network] = 0;
            }
            networkTotals[network]++;
        });

        // Update totals display
        if (totalTransactionsElement) {
            totalTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Network (Transactions) </summary>
                    <p>${totalTransactions}</p>
                </details>
            `;
        }
        if (dailyTransactionsElement) {
            dailyTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transactions Today</summary>
                    <p>${dailyTransactions}</p>
                </details>
            `;
        }
        if (totalGasFeeElement) {
            totalGasFeeElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Gasfee Onchain</summary>
                    <p>${totalGasFee.toFixed(2)}</p>
                </details>
            `;
        }

        // Display network totals
        if (networkDetailsElement) {
            let networkDetailsHtml = '<details class="detailstx"><summary>Transaction Totals by Network</summary><div>';
            for (const [network, count] of Object.entries(networkTotals)) {
                networkDetailsHtml += `<p><strong>${network.toUpperCase()}:</strong> ${count} transactions</p>`;
            }
            networkDetailsHtml += '</div></details>';
            networkDetailsElement.innerHTML = networkDetailsHtml;
        }
    } else {
        if (transactionsContainer) {
            transactionsContainer.innerHTML = '<p>No transactions found.</p>';
        }
        if (totalTransactionsElement) {
            totalTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Transactions</summary>
                    <p>Total Transactions: 0</p>
                </details>
            `;
        }
        if (dailyTransactionsElement) {
            dailyTransactionsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transactions Today</summary>
                    <p>Transactions Today: 0</p>
                </details>
            `;
        }
        if (totalGasFeeElement) {
            totalGasFeeElement.innerHTML = `
                <details class="detailstx">
                    <summary>Total Gasfee Onchain</summary>
                    <p>Total Gas Fee: 0.00</p>
                </details>
            `;
        }
        if (networkDetailsElement) {
            networkDetailsElement.innerHTML = `
                <details class="detailstx">
                    <summary>Transaction Totals by Network</summary>
                    <p>No network data available.</p>
                </details>
            `;
        }
    }
}

// Call the function to display transactions
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        handleSearch(); // Display transactions on load
    } else {
        if (transactionsContainer) {
            transactionsContainer.innerHTML = '<p>Please sign in to view transactions.</p>';
        }
    }
});


// Function to handle search input
function handleSearch() {
    const query = searchInput.value.toLowerCase();
    const userId = firebase.auth().currentUser.uid;
    const transactionsRef = database.ref(`transactions/allnetwork`);

    transactionsRef.once('value', snapshot => {
        const transactions = snapshot.val();
        const filteredTransactions = filterTransactions(query, transactions);
        displayTransactions(filteredTransactions);
    }).catch(error => {
        transactionsContainer.innerHTML = `<p>Error fetching transactions: ${error.message}</p>`;
    });
}

// Generate Explorer URL
function generateExplorerUrl(network, transactionHash) {
    let baseUrl;

    switch (network) {
        case 'btc':
            baseUrl = 'https://explorer.btc.com/tx/';
            break;
        default:
            baseUrl = '#';
    }

    return `${baseUrl}${transactionHash}`;
}

// Add event listener to search input
searchInput.addEventListener('input', handleSearch);

// Call the function to display transactions
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        handleSearch(); // Display transactions on load
    } else {
        transactionsContainer.innerHTML = '<p>Please sign in to view transactions.</p>';
    }
});
