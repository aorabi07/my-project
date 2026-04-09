// --- Elements --- 
const authPage = document.getElementById('authPage');
const mainContent = document.getElementById('mainContent');
const loginFields = document.getElementById('loginFields');
const registerFields = document.getElementById('registerFields');
const switchAuth = document.getElementById('switchAuth');
const cartSidebar = document.getElementById('cartSidebar');
const cartItemsList = document.getElementById('cartItemsList');

let cart = [];

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyALxTPnVJyslzlG0_5B-evRHipi0_Y4xVU",
  authDomain: "flavorhaven-web.firebaseapp.com",
  projectId: "flavorhaven-web",
  storageBucket: "flavorhaven-web.firebasestorage.app",
  messagingSenderId: "518093443491",
  appId: "1:518093443491:web:53f6f3df3a60cea8aa0a16",
  databaseURL: "https://flavorhaven-web-default-rtdb.firebaseio.com/" // Realtime DB URL
};

// Firebase initialize (Compat Version)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rtdb = firebase.database(); // Firestore bad diye ekhon Realtime DB

// --- Auth Handling (Toggle UI) ---
switchAuth.addEventListener('click', () => {
    if (loginFields.style.display === 'none') {
        loginFields.style.display = 'block'; registerFields.style.display = 'none';
        document.getElementById('authTitle').innerText = "Login to Your Account";
        switchAuth.innerText = "Don't have an account? Register here";
    } else {
        loginFields.style.display = 'none'; registerFields.style.display = 'block';
        document.getElementById('authTitle').innerText = "Create a New Account";
        switchAuth.innerText = "Already have an account? Login here";
    }
});

// --- Firebase Registration ---
document.getElementById('regSubmit').addEventListener('click', () => {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;

    if(name && email && pass) {
        auth.createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert("Registration Successful! Please login.");
            switchAuth.click();
        })
        .catch((error) => alert("Error: " + error.message));
    } else { alert("Fill all fields!"); }
});

// --- Firebase Login ---
document.getElementById('loginSubmit').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    auth.signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
        authPage.style.display = 'none';
        mainContent.style.display = 'block';
        alert("Welcome, " + userCredential.user.displayName);
    })
    .catch((error) => alert("Login failed: " + error.message));
});

// --- Logout ---
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        mainContent.style.display = 'none';
        authPage.style.display = 'flex';
    });
});

// --- Search & Filter ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.dish-card').forEach(card => {
            card.style.display = (filter === 'all' || card.dataset.restaurant === filter) ? 'block' : 'none';
        });
    });
});

document.querySelector('.search-btn').addEventListener('click', () => {
    const term = document.getElementById('dishSearch').value.toLowerCase();
    document.querySelectorAll('.dish-card').forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(term) ? 'block' : 'none';
    });
});

// --- Cart Logic ---
document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        cart.push({name: btn.dataset.name, price: parseFloat(btn.dataset.price)});
        updateUI();
        cartSidebar.classList.add('active');
    });
});

function updateUI() {
    cartItemsList.innerHTML = ""; let total = 0;
    cart.forEach(item => {
        total += item.price;
        const d = document.createElement('div');
        d.innerHTML = `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
            <span>${item.name}</span><b>$${item.price.toFixed(2)}</b></div>`;
        cartItemsList.appendChild(d);
    });
    document.getElementById('cartCount').innerText = cart.length; 
    document.getElementById('cartTotalAmount').innerText = total.toFixed(2);
}

// --- Checkout (Saving to Realtime Database) ---
document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) return alert("Cart is empty!");
    
    const user = auth.currentUser;
    if(!user) return alert("Login first!");

    // Realtime Database-e data save kora
    rtdb.ref('orders/').push({
        userName: user.displayName,
        userEmail: user.email,
        items: cart,
        total: document.getElementById('cartTotalAmount').innerText,
        date: new Date().toLocaleString()
    })
    .then(() => {
        alert("Success! Order saved in Realtime Database.");
        cart = []; updateUI(); cartSidebar.classList.remove('active');
    })
    .catch((error) => alert("Order failed: " + error.message));
});
document.getElementById('cartIconBtn').addEventListener('click', () => cartSidebar.classList.add('active'));
document.getElementById('closeCart').addEventListener('click', () => cartSidebar.classList.remove('active'));

// --- Table Reservation (Saving to Realtime Database) ---
document.getElementById('bookTableBtn').addEventListener('click', () => {
    const user = auth.currentUser;
    if(!user) return alert("Please login first to reserve a table!");

    const restaurant = document.getElementById('resName').value;
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;

    if(!restaurant || !date) {
        return alert("Please enter restaurant name and date!");
    }

    // Database-e data pathano
    rtdb.ref('reservations/').push({
        userName: user.displayName,
        userEmail: user.email,
        restaurantName: restaurant,
        reservationDate: date,
        reservationTime: time || "Not specified",
        submittedAt: new Date().toLocaleString()
    })
    .then(() => {
        alert("Success! Your table at " + restaurant + " is reserved.");
        // Form khali kora
        document.getElementById('resName').value = "";
        document.getElementById('resDate').value = "";
        document.getElementById('resTime').value = "";
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("Reservation failed: " + error.message);
    });
});