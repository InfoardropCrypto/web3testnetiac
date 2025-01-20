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
const networkSelect = document.getElementById('networkSelect');
const miningOptionsSelect = document.getElementById('miningOptionsSelect');
const startMiningButton = document.getElementById('startMiningButton');
const miningStatusText = document.getElementById('miningStatus');
const miningBalanceElement = document.getElementById('miningBalance');
const miningTickerElement = document.getElementById('miningTicker');
const miningTimeElement = document.getElementById('miningTime');

// Define mining options
const miningOptions = {
    btc: {
        easy: { reward: 0.00000345917, time: 600000 },
        medium: { reward: 0.00001037751, time: 1800000 },
        hard: { reward: 0.00002075502, time: 3600000 }
    },
    eth: {
        easy: { reward: 0.00003675, time: 600000 },
        medium: { reward: 0.00011025, time: 1800000 },
        hard: { reward: 0.00018375, time: 3600000 }
    },
    bsc: {
        easy: { reward: 0.00053675, time: 600000 },
        medium: { reward: 0.00227, time: 1800000 },
        hard: { reward: 0.005675, time: 3600000 }
    },
    polygon: {
        easy: { reward: 0.49, time: 600000 },
        medium: { reward: 1.47, time: 1800000 },
        hard: { reward: 11.76, time: 3600000 }
    },
    ton: {
        easy: { reward: 0.12863, time: 600000 },
        medium: { reward: 0.518837, time: 1800000 },
        hard: { reward: 1.12774, time: 3600000 }
    },
    sol: { 
        easy: { reward: 0.01652, time: 600000 },
        medium: { reward: 0.06608, time: 1800000 },
        hard: { reward: 0.39648, time: 3600000 }
    }
};

// Define ticker map
const tickerMap = {
    polygon: 'MATIC',
    bsc: 'BSC',
    btc: 'BTC',
    eth: 'ETH',
    sol: 'SOL',
    ton: 'TON'
};

// Track mining state
let isMining = false;

// Start mining process
startMiningButton.addEventListener('click', () => {
    if (isMining) {
        return; // Prevent starting another mining session
    }

    isMining = true;
    miningStatusText.textContent = 'Mining in Progress...';
    startMiningButton.disabled = true; // Disable the button

    const selectedOption = miningOptionsSelect.value;
    const selectedNetwork = networkSelect.value;

    // Get reward and time based on the selected network and option
    const { reward, time } = miningOptions[selectedNetwork][selectedOption];

    // Update ticker element based on the selected network
    const ticker = tickerMap[selectedNetwork] || 'BTC'; // Default to BTC if network is not found
    miningTickerElement.textContent = ticker;

    let remainingTime = time / 1000; // Convert milliseconds to seconds
    miningTimeElement.textContent = remainingTime;

    const interval = setInterval(() => {
        remainingTime -= 1;
        miningTimeElement.textContent = remainingTime;
        if (remainingTime <= 0) {
            clearInterval(interval);
            const userId = firebase.auth().currentUser.uid;
            const balanceRef = firebase.database().ref(`wallets/${userId}/${selectedNetwork}/balance`);

            balanceRef.once('value').then(snapshot => {
                const currentBalance = snapshot.val() || 0;
                balanceRef.set(currentBalance + reward);

                // Update mining balance display
                miningBalanceElement.textContent = (currentBalance + reward).toFixed(8);
                miningStatusText.textContent = 'Mining Completed!';
                isMining = false;
                startMiningButton.disabled = false; // Re-enable the button
            });
        }
    }, 1000); // Update every second
});
