// Product Data
const products = [
    {
        id: 1,
        name: "Air Max 270",
        brand: "Nike",
        price: 150.00,
        image: "nikeair.jfif"
    },
    {
        id: 2,
        name: "Ultra Boost",
        brand: "Adidas",
        price: 180.00,
        image: "adidasultra.jfif"
    },
    {
        id: 3,
        name: "Classic Leather",
        brand: "Reebok",
        price: 75.00,
        image: "reebokclassic.jfif"
    },
    {
        id: 4,
        name: "Old Skool",
        brand: "Vans",
        price: 65.00,
        image: "vansold.jfif"
    }
];

// DOM Elements
const sortSelect = document.getElementById('sort');
const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
const cartSidebar = document.getElementById('cartSidebar');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const loginModal = document.getElementById('loginModal');

// Initialize cart if not already initialized
if (typeof window.cart === 'undefined') {
    window.cart = [];
}

// Check login state
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Initial display of all products
    displayFilteredProducts();
    
    // Load saved filter state
    loadFilterState();
    
    // Setup other functionality
    setupEventListeners();
    setupCartFunctionality();
    setupAuthFunctionality();
    loadCart();
    updateNavigation();
});

// Set up event listeners
function setupEventListeners() {
    // Sort change
    if (sortSelect) {
        sortSelect.addEventListener('change', displayFilteredProducts);
    }

    // Filter changes
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', displayFilteredProducts);
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        // Close cart when clicking outside
        if (cartSidebar && cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            !e.target.closest('.cart-icon')) {
            toggleCart();
        }

        // Close login modal when clicking outside
        if (loginModal && loginModal.style.display === 'block' && 
            !loginModal.querySelector('.modal-content').contains(e.target)) {
            closeLoginModal();
        }
    });

    // Close button for login modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeLoginModal);
    }

    // Setup cart overlay click handler
    const cartOverlay = document.querySelector('.cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
    }
}

// Set up cart functionality
function setupCartFunctionality() {
    const cartIcon = document.querySelector('.cart-icon');
    const closeCart = document.querySelector('.close-cart');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCart();
        });
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCart();
        });
    }

    // Listen for storage events to update cart when changed from other pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            window.cart = JSON.parse(e.newValue || '[]');
            updateCartDisplay();
        }
    });
}

// Toggle cart sidebar
function toggleCart(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (cartSidebar) {
        // Create overlay if it doesn't exist
        let overlay = document.querySelector('.cart-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'cart-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', toggleCart);
        }
        
        // Toggle cart and overlay
        cartSidebar.classList.toggle('active');
        if (cartSidebar.classList.contains('active')) {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }
}

// Load cart from localStorage
function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            window.cart = JSON.parse(savedCart);
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        window.cart = [];
    }
}

// Update cart display
function updateCartDisplay() {
    if (!cartItems || !cartTotal || !cartCount) return;
    
    if (window.cart.length === 0) {
        // Show empty cart message
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <button class="btn secondary" onclick="toggleCart()">Continue Shopping</button>
            </div>
        `;
        cartTotal.textContent = '$0.00';
        cartCount.textContent = '0';
    } else {
        // Update cart items display
        cartItems.innerHTML = window.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${item.id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" 
                    title="Remove item">&times;</button>
            </div>
        `).join('');

        // Update cart total
        const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;

        // Update cart count
        const count = window.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = count.toString();
        
        // Show/hide cart count badge
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Get selected filters
function getSelectedFilters() {
    // Get brand filters
    const brandCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    const brands = Array.from(brandCheckboxes)
        .filter(input => input.checked && !input.value.includes('-') && !input.value.includes('+'))
        .map(input => input.value.toLowerCase());

    // Get price range filters
    const priceCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    const priceRanges = Array.from(priceCheckboxes)
        .filter(input => input.checked && (input.value.includes('-') || input.value.includes('+')))
        .map(input => {
            if (input.value.includes('+')) {
                const min = parseInt(input.value);
                return { min, max: Infinity };
            }
            const [min, max] = input.value.split('-').map(Number);
            return { min, max };
        });

    return { brands, priceRanges };
}

// Filter products
function filterProducts(products) {
    if (!products || !Array.isArray(products)) {
        console.error('Products array is not available');
        return [];
    }

    const { brands, priceRanges } = getSelectedFilters();

    return products.filter(product => {
        // Brand filter
        const brandMatch = brands.length === 0 || brands.includes(product.brand.toLowerCase());
        
        // Price filter
        const priceMatch = priceRanges.length === 0 || priceRanges.some(range => 
            product.price >= range.min && product.price <= range.max
        );

        return brandMatch && priceMatch;
    });
}

// Sort products
function sortProducts(products) {
    const sortBy = sortSelect.value;
    
    return [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0; // Featured - keep original order
        }
    });
}

// Display filtered and sorted products
function displayFilteredProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.error('Product grid element not found');
        return;
    }

    let filteredProducts = filterProducts(products);
    filteredProducts = sortProducts(filteredProducts);

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = `
            <div class="no-products-message">
                <p>No products match your selected filters.</p>
                <button class="btn secondary" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
    } else {
        productGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card" onclick="navigateToProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.brand}</h3>
                <h4>${product.name}</h4>
                <p class="price">$${product.price.toFixed(2)}</p>
                <button class="btn primary" onclick="addToCartAndStay(event, ${product.id})">Add to Cart</button>
            </div>
        `).join('');
    }

    // Update products count
    const productsHeader = document.querySelector('.products-header h1');
    if (productsHeader) {
        productsHeader.textContent = `All Products (${filteredProducts.length})`;
    }

    // Save filter state
    saveFilterState();
}

// Reset filters
function resetFilters() {
    filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    sortSelect.value = 'featured';
    displayFilteredProducts();
}

// Save filter state
function saveFilterState() {
    const filterState = {
        brands: Array.from(document.querySelectorAll('.filter-group input[type="checkbox"]'))
            .filter(input => input.checked)
            .map(input => input.value),
        sort: sortSelect.value
    };
    sessionStorage.setItem('filterState', JSON.stringify(filterState));
}

// Load filter state
function loadFilterState() {
    const savedState = sessionStorage.getItem('filterState');
    if (savedState) {
        const filterState = JSON.parse(savedState);
        
        // Restore checkboxes
        filterState.brands.forEach(value => {
            const checkbox = document.querySelector(`.filter-group input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Restore sort
        if (filterState.sort) {
            sortSelect.value = filterState.sort;
        }
        
        displayFilteredProducts();
    }
}

// Mobile filters toggle
const mobileFilterBtn = document.createElement('button');
mobileFilterBtn.className = 'btn secondary mobile-filter-btn';
mobileFilterBtn.textContent = 'Filters';
mobileFilterBtn.onclick = toggleFilters;

function toggleFilters() {
    document.querySelector('.filters-section').classList.toggle('active');
}

// Add mobile filter button on small screens
if (window.innerWidth <= 768) {
    document.querySelector('.products-header').prepend(mobileFilterBtn);
}

// Add mobile-specific styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    .mobile-filter-btn {
        display: none;
    }

    @media (max-width: 768px) {
        .mobile-filter-btn {
            display: block;
            margin-bottom: 1rem;
        }

        .filters-section {
            background: var(--white);
            padding: 2rem;
        }
    }
`;
document.head.appendChild(mobileStyles);

// Add to cart function
function addToCart(productId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

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
    updateCartDisplay();
    
    // First show notification
    showNotification('Added to cart!');
    
    // Then open cart with a slight delay to ensure smooth animation
    setTimeout(() => {
        if (!cartSidebar.classList.contains('active')) {
            toggleCart();
        }
    }, 100);
}

// Add to cart without navigation
function addToCartAndStay(event, productId) {
    event.stopPropagation();
    addToCart(productId);
}

// Show notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification${isError ? ' error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Remove from cart
function removeFromCart(productId) {
    window.cart = window.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
}

// Update quantity
function updateQuantity(productId, change) {
    const item = window.cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartDisplay();
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(window.cart));
}

// Setup authentication functionality
function setupAuthFunctionality() {
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
        });
    });
}

// Show login modal
function showLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'block';
        // Reset to login tab
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.querySelector('[data-tab="login"]').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
        // Clear any previous input
        document.querySelectorAll('.auth-form input').forEach(input => input.value = '');
    }
}

// Close login modal
function closeLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
        // Clear any input values
        document.querySelectorAll('.auth-form input').forEach(input => input.value = '');
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email
        }));
        
        closeLoginModal();
        showNotification('Successfully logged in!');
        updateNavigation();
    } else {
        showNotification('No matching account found. Please check your email and password.', true);
    }
}

// Handle signup form submission
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if email already exists
    if (users.some(user => user.email === email)) {
        showNotification('Email already registered!');
        return;
    }

    // Add new user
    users.push({
        name,
        email,
        password // In a real app, this should be hashed
    });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after signup
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({
        name,
        email
    }));

    closeLoginModal();
    showNotification('Successfully signed up and logged in!');
    updateNavigation();
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.cart = [];
    saveCart();
    updateCartDisplay();
    updateNavigation();
    showNotification('Successfully logged out!');
}

// Update navigation based on login state
function updateNavigation() {
    const userIcon = document.querySelector('.nav-icons .fa-user');
    if (!userIcon) return;

    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    
    if (isLoggedIn()) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        userMenu.innerHTML = `
            <i class="fas fa-user"></i>
            <div class="dropdown">
                <span>${currentUser.name}</span>
                <button onclick="handleLogout()">Logout</button>
            </div>
        `;
        userIcon.parentNode.replaceChild(userMenu, userIcon);
        
        // Toggle dropdown on click
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.querySelector('.dropdown').classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userMenu.querySelector('.dropdown').classList.remove('active');
        });
    } else {
        userIcon.onclick = showLoginModal;
    }
}

// Navigate to product page
function navigateToProduct(productId) {
    window.location.href = `products.html?product=${productId}`;
}