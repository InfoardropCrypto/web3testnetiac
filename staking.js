// Firebase initialization
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const stakingContainer = document.getElementById('stakingContainer');
const authContainer = document.getElementById('authContainer');
const stakeAmountInput = document.getElementById('stakeAmount');
const stakeDurationInput = document.getElementById('stakeDuration');
const stakingResult = document.getElementById('stakingResult');
const currentStakes = document.getElementById('currentStakes');
const walletAddressDisplay = document.getElementById('walletAddress');
const walletBalanceDisplay = document.getElementById('walletBalance');
const selectedNetworkDisplay = document.getElementById('selectedNetwork');
const stakeButton = document.getElementById('stakeButton');
const unstakeButton = document.getElementById('unstakeButton');
const networkSelect = document.getElementById('networkSelect');

const networkTickers = {
    btc: 'BTC',
    ton: 'TON',
    sol: 'SOL',
    eth: 'ETH',
    steth: 'ETH',
    polygon: 'POL',
    
};

// Event listener untuk ganti network
networkSelect.addEventListener('change', (event) => {
    selectedNetwork = event.target.value;
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase(); // Update tampilan jaringan
    loadWalletDetails(auth.currentUser.uid); // Muat ulang detail wallet sesuai dengan jaringan yang dipilih
    loadCurrentStakes(auth.currentUser.uid); // Muat ulang staking sesuai dengan jaringan yang dipilih
});

// Update fungsi loadWalletDetails
function loadWalletDetails(userId) {
    const networkPath = `wallets/${userId}/${selectedNetwork}`;

    // Load Address
    database.ref(`${networkPath}/address`).once('value', snapshot => {
        walletAddressDisplay.textContent = snapshot.val() || 'Please Add Network On Wallet';
    });

   // Load Balance
database.ref(`${networkPath}/balance`).once('value', snapshot => {
    walletBalance = snapshot.val() || 0;

    // Format balance dengan 8 angka desimal dan tanda koma
    const formattedBalance = walletBalance.toLocaleString('en-US', { 
        minimumFractionDigits: 8, 
        maximumFractionDigits: 8 
    });

    walletBalanceDisplay.textContent = formattedBalance;
});


    // Display Network
    selectedNetworkDisplay.textContent = selectedNetwork.toUpperCase();
}

function loadCurrentStakes(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);

    stakesRef.once('value', snapshot => {
        const stakes = snapshot.val();
        currentStakes.innerHTML = '';

        if (stakes) {
            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];
                const stakeElement = document.createElement('div');
                stakeElement.innerHTML = `
                    Amount: ${stake.amount} <br>
                    Duration: ${stake.duration} days <br>
                    Start Time: ${formatDateToIndonesian(stake.startTime)} <br>
                    End Time: ${formatDateToIndonesian(stake.endTime)} <br>
                    ${stake.claimed ? `Claim Time: ${formatDateToIndonesian(stake.claimTime)}` : 'Not Claimed Yet'}
                `;
                
                // Add Unstake button
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.addEventListener('click', () => unstake(stakeId, stake.amount));
                stakeElement.appendChild(unstakeBtn);
                
                // Add Claim Reward button
                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.addEventListener('click', () => claimReward(stakeId, stake.amount));
                stakeElement.appendChild(claimBtn);

                currentStakes.appendChild(stakeElement);
            });
        } else {
            currentStakes.textContent = 'No current stakes found.';
        }
    });
}


let selectedNetwork = 'ton';  // Network
let walletBalance = 0;

auth.onAuthStateChanged(user => {
    if (user) {
        authContainer.style.display = 'none';
        stakingContainer.style.display = 'block';
        loadCurrentStakes(user.uid);
        loadWalletDetails(user.uid);
    } else {
        authContainer.style.display = 'block';
        stakingContainer.style.display = 'none';
    }
});

// Format Date for Indonesia
function formatDateToIndonesian(date) {
    if (!date || isNaN(new Date(date).getTime())) {
        return 'Invalid date'; // Return a default message for invalid dates
    }
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date));
}

// Stake Functionality
stakeButton.addEventListener('click', () => {
    const amount = parseFloat(stakeAmountInput.value);
    const duration = parseInt(stakeDurationInput.value);  // Menggunakan input dari pengguna untuk durasi

    if (isNaN(amount) || amount <= 0 || isNaN(duration) || duration <= 0) {
        stakingResult.textContent = 'Invalid amount or duration.';
        return;
    }
    
    if (amount > walletBalance) {
        stakingResult.textContent = 'Insufficient balance for staking.';
        return;
    }

    const confirmStake = (`Are you sure you want to stake ${amount} ${selectedNetwork} for ${duration} days?`);
    if (!confirm(confirmStake)) {
      alert('Stake canceled.');
        return; // User canceled the staking
    }
    
    
    const userId = auth.currentUser.uid;
    const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`).push();

    // Menggunakan durasi input dari pengguna untuk menghitung endTime
    const stakeData = {
        amount: amount,
        duration: duration,
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + duration * 24 * 60 * 60 * 1000).toISOString(),  // Menghitung endTime berdasarkan durasi
        claimed: false,
        claimTime: null
    };

    const newBalance = walletBalance - amount;
    const balanceRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

    balanceRef.set(newBalance).then(() => {
        stakeRef.set(stakeData).then(() => {
            stakingResult.textContent = 'Staking successful!';
            walletBalance = newBalance;
            walletBalanceDisplay.textContent = walletBalance.toFixed(4);
            loadCurrentStakes(userId);
        }).catch(error => {
            console.error('Error staking:', error);
            stakingResult.textContent = 'Error staking. Please try again.';
        });
    }).catch(error => {
        console.error('Error updating balance:', error);
        stakingResult.textContent = 'Error updating balance. Please try again.';
    });
});

// Unstake functionality
function unstake(stakeId, amount) {
    const userId = firebase.auth().currentUser.uid;

    getGasFee(gasFee => {
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);

        userRef.once('value', snapshot => {
            const balance = snapshot.val();

            if (balance >= gasFee) {
                const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
                stakeRef.once('value', snapshot => {
                    const stake = snapshot.val();

                    if (stake) {
                        if (confirm(`Are you sure you want to unstake ${amount}? This will incur a gas fee of ${gasFee}.`)) {
                            // Calculate new balance after unstaking and adding back the amount, then deduct gas fee
                            const newBalance = balance - gasFee + amount;

                            stakeRef.remove().then(() => {
                                userRef.set(newBalance).then(() => {
                                    // Update walletBalance in the UI
                                    walletBalance = newBalance;
                                    walletBalanceDisplay.textContent = walletBalance.toFixed(4);

                                    alert('Unstaked successfully! Tokens has been returned to your wallet.');
                                    loadCurrentStakes(userId); // Refresh stakes
                                }).catch(error => {
                                    console.error('Error updating balance:', error);
                                });
                            }).catch(error => {
                                console.error('Error unstaking:', error);
                            });
                        } else {
                            alert('Unstake canceled.');
                        }
                    } else {
                        alert('Staking data not found.');
                    }
                });
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}

function claimReward(stakeId, amount) {
    const userId = firebase.auth().currentUser.uid;
    
    getGasFee(gasFee => {
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        
        userRef.once('value', snapshot => {
            const balance = snapshot.val();
            
            if (balance >= gasFee) {
                const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking/${stakeId}`);
                stakeRef.once('value', snapshot => {
                    const stake = snapshot.val();

                    if (stake) {
                        const now = new Date();
                        const endTime = new Date(stake.endTime);

                        // Pastikan staking period sudah selesai
                        if (now < endTime) {
                            alert('Reward cannot be claimed before the staking period ends.');
                            return;
                        }

                        // Cek apakah reward sudah diklaim
                        if (stake.claimed) {
                            alert('Reward has already been claimed.');
                            return;
                        }

                        // Hitung reward yang akan diberikan
                        const reward = calculateReward(stake.amount, stake.duration);

                        if (confirm(`Are you sure you want to claim your reward? This will incur a gas fee of ${gasFee}.`)) {
                            // Update staking data (claimed = true dan claimTime)
                            stakeRef.update({
                                claimed: true,
                                claimTime: now.toISOString()
                            }).then(() => {
                                // Update balance dengan menambahkan reward dan mengurangi gas fee
                                const newBalance = balance + reward - gasFee;
                                userRef.set(newBalance).then(() => {
                                    // Update balance di tampilan UI
                                    walletBalance = newBalance;
                                    walletBalanceDisplay.textContent = walletBalance.toFixed(4);
                                    
                                    alert('Reward claimed successfully!');
                                    loadCurrentStakes(userId); // Refresh stakes
                                }).catch(error => {
                                    console.error('Error updating balance:', error);
                                    alert('Error updating balance. Please try again.');
                                });
                            }).catch(error => {
                                console.error('Error claiming reward:', error);
                                alert('Error claiming reward. Please try again.');
                            });
                        } else {
                            alert('Claim canceled.');
                        }
                    } else {
                        alert('Staking data not found.');
                    }
                });
            } else {
                alert('Insufficient balance for gas fee.');
            }
        });
    });
}

// Function to calculate reward
function calculateReward(amount, duration) {
    const rewardRate = 0.05479452; // 2000% reward per day
    return amount * rewardRate * duration;
}

// Function to update estimated reward
function updateEstimatedReward() {
    const amount = parseFloat(stakeAmountInput.value);
    const duration = parseInt(stakeDurationInput.value);

    if (!isNaN(amount) && !isNaN(duration) && amount > 0 && duration > 0) {
        const estimatedReward = calculateReward(amount, duration);
        document.getElementById('estimatedReward').textContent = estimatedReward.toFixed(10);
    } else {
        document.getElementById('estimatedReward').textContent = '0.0000';
    }
}

// Event listeners for amount and duration inputs
stakeAmountInput.addEventListener('input', updateEstimatedReward);
stakeDurationInput.addEventListener('input', updateEstimatedReward);

// Update countdown function
function startCountdown(endTime, element) {
    function updateCountdown() {
        const now = new Date();
        const end = new Date(endTime);
        const timeDiff = end - now;

        if (timeDiff <= 0) {
            element.textContent = '00:00:00:00'; // DD:HH:MM:SS
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

        const formatted = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        element.textContent = formatted;
    }

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Load Current Stakes with Countdown
function loadCurrentStakes(userId) {
    const stakesRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`);

    stakesRef.once('value', snapshot => {
        const stakes = snapshot.val();
        currentStakes.innerHTML = '';

        if (stakes) {
            Object.keys(stakes).forEach(stakeId => {
                const stake = stakes[stakeId];
                const stakeElement = document.createElement('div');
                
                // Create countdown container
                const countdownElement = document.createElement('div');
                countdownElement.classList.add('countdown');
                stakeElement.appendChild(countdownElement);

                stakeElement.innerHTML += `
                    <br> { amount: "${stake.amount} ${selectedNetwork}" <br>
                    duration: "${stake.duration}" days <br>
                    start time: "${formatDateToIndonesian(stake.startTime)}" <br>
                    claim time: "${formatDateToIndonesian(stake.endTime)}" <br>
                    estimated reward: "${calculateReward(stake.amount, stake.duration).toFixed(4)} ${selectedNetwork}" <br>
                    ${stake.claimed ? `claim time: ${formatDateToIndonesian(stake.claimTime)}` : 'not claimed yet }'}
                `;
                
                // Add Unstake button for each stake
                const unstakeBtn = document.createElement('button');
                unstakeBtn.textContent = 'Unstake';
                unstakeBtn.addEventListener('click', () => unstake(stakeId, stake.amount));
                stakeElement.appendChild(unstakeBtn);
                
                // Add Claim Reward button for each stake
                const claimBtn = document.createElement('button');
                claimBtn.textContent = 'Claim';
                claimBtn.addEventListener('click', () => claimReward(stakeId, stake.amount));
                stakeElement.appendChild(claimBtn);

                currentStakes.appendChild(stakeElement);

                // Start countdown
                startCountdown(stake.endTime, countdownElement);
            });
        } else {
            currentStakes.textContent = 'No current stakes found.';
        }
    });
}

// Get Gas Fee for the selected network
function getGasFee(callback) {
    const gasFeeRef = database.ref(`gasprice/${selectedNetwork}/gasFee`);
    
    gasFeeRef.once('value', snapshot => {
        const gasFee = snapshot.val();
        if (callback) {
            callback(gasFee);
        }
    });
}

// Example stake function with gas fee
function stake(amount) {
    const userId = firebase.auth().currentUser.uid;

    getGasFee(gasFee => {
        const totalAmount = amount + gasFee;
        const userRef = database.ref(`wallets/${userId}/${selectedNetwork}/balance`);
        
        userRef.once('value', snapshot => {
            const balance = snapshot.val();

            if (balance >= totalAmount) {
                if (confirm(`Are you sure you want to stake ${amount}? This will incur a gas fee of ${gasFee}.`)) {
                    const stakeRef = database.ref(`wallets/${userId}/${selectedNetwork}/staking`).push();
                    const now = new Date();

                    stakeRef.set({
                        amount: amount,
                        duration: 30, // Example duration
                        startTime: now.toISOString(),
                        endTime: new Date(now.getTime() + 30*24*60*60*1000).toISOString(), // End time after 30 days
                        claimed: false,
                        claimTime: null
                    }).then(() => {
                        userRef.set(balance - totalAmount); // Deduct balance including gas fee
                        alert('Staking successful!');
                        loadCurrentStakes(userId); // Refresh stakes
                    }).catch(error => {
                        console.error('Error staking:', error);
                    });
                } else {
                    alert('Staking canceled.');
                }
            } else {
                alert('Insufficient balance for staking and gas fee.');
            }
        });
    });
}

document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    const elements = document.querySelectorAll('nav, .wallet-details, .stake-form');
    elements.forEach(el => el.classList.toggle('dark-theme'));

    const themeIcon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon'); // Ubah ikon menjadi bulan
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun'); // Ubah ikon menjadi matahari
    }
});
