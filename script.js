// Sample product data
const products = [
    {
        id: 1,
        brand: 'Nike',
        name: 'Air Max 270',
        price: 150,
        image: 'nikeair.jfif'
    },
    {
        id: 2,
        brand: 'Adidas',
        name: 'Ultra Boost',
        price: 180,
        image: 'adidasultra.jfif'
    },
    {
        id: 3,
        brand: 'Reebok',
        name: 'Classic Leather',
        price: 90,
        image: 'reebokclassic.jfif'
    },
    {
        id: 4,
        brand: 'Vans',
        name: 'Old Skool',
        price: 65,
        image: 'vansold.jfif'
    }
];

// Cart functionality
window.cart = [];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const cartSidebar = document.getElementById('cartSidebar');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const loginModal = document.getElementById('loginModal');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    displayProducts();
    setupEventListeners();
});

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        window.cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Display products in the grid
function displayProducts() {
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="navigateToProduct(${product.id})">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.brand}</h3>
            <h4>${product.name}</h4>
            <p class="price">$${product.price}</p>
            <button class="btn primary" onclick="addToCartAndStay(event, ${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

// Navigate to product page
function navigateToProduct(productId) {
    window.location.href = `products.html?product=${productId}`;
}

// Set up event listeners
function setupEventListeners() {
    // Cart toggle
    const cartIcon = document.querySelector('.cart-icon');
    const closeCart = document.querySelector('.close-cart');
    
    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);

    // Login modal
    const userIcon = document.querySelector('.nav-icons .fa-user');
    const closeModal = document.querySelector('.close-modal');
    
    if (userIcon) userIcon.addEventListener('click', toggleLoginModal);
    if (closeModal) closeModal.addEventListener('click', toggleLoginModal);

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            toggleLoginModal();
        }
    });

    // Hero buttons
    const shopNowBtn = document.querySelector('.hero-buttons .primary');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Listen for storage events to update cart when changed from other pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            window.cart = JSON.parse(e.newValue || '[]');
            updateCart();
        }
    });
}

// Toggle cart sidebar
function toggleCart(event) {
    if (event) {
        event.stopPropagation();
    }
    if (cartSidebar) {
        cartSidebar.classList.toggle('active');
    }
}

// Toggle login modal
function toggleLoginModal() {
    loginModal.style.display = loginModal.style.display === 'block' ? 'none' : 'block';
}

// Add to cart without navigation
function addToCartAndStay(event, productId) {
    event.stopPropagation();
    addToCart(productId);
}

// Add item to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = window.cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        window.cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    toggleCart();
}

// Remove item from cart
function removeFromCart(productId) {
    window.cart = window.cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
}

// Update quantity in cart
function updateQuantity(productId, change) {
    const item = window.cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCart();
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(window.cart));
}

// Update cart display
function updateCart() {
    if (!cartItems || !cartTotal || !cartCount) return;

    // Update cart items display
    cartItems.innerHTML = window.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>$${item.price}</p>
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button onclick="removeFromCart(${item.id})" class="remove-item">&times;</button>
        </div>
    `).join('');

    // Update cart total
    const total = window.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;

    // Update cart count
    const count = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Here you would typically make an API call to authenticate
    console.log('Login attempted with:', { email, password });
    
    // For demo purposes, just close the modal
    toggleLoginModal();
}

// Add CSS styles for cart items
const style = document.createElement('style');
style.textContent = `
    .cart-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--light-gray);
        position: relative;
    }

    .cart-item-details {
        margin-left: 1rem;
        flex-grow: 1;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .quantity-controls button {
        background: var(--secondary-color);
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
    }

    .remove-item {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0.5rem;
        color: var(--accent-color);
    }
`;
document.head.appendChild(style); 