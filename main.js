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

// Global state
window.cart = [];

// DOM Elements
const productGrid = document.getElementById('productGrid');
const sortSelect = document.getElementById('sort');
const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
const cartSidebar = document.getElementById('cartSidebar');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const loginModal = document.getElementById('loginModal');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the products page
    const isProductsPage = window.location.pathname.includes('products.html');
    
    if (isProductsPage) {
        displayFilteredProducts();
        loadFilterState();
    } else {
        // Home page initialization
        displayProducts();
    }
    
    setupEventListeners();
    setupCartFunctionality();
    setupAuthFunctionality();
    setupSearchFunctionality();
    loadCart();
    updateNavigation();
    setupCheckoutFunctionality();
});

// Setup event listeners
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
            !e.target.closest('.modal-content') && 
            !e.target.closest('.nav-icons .fa-user')) {
            closeLoginModal();
        }
    });

    // Close button for login modal
    const closeModalBtns = document.querySelectorAll('.close-modal');
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = btn.closest('.modal');
                if (modal.id === 'loginModal') {
                    closeLoginModal();
                } else if (modal.id === 'searchModal') {
                    closeSearchModal();
                }
            });
        });
    }

    // Setup cart overlay click handler
    const cartOverlay = document.querySelector('.cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', toggleCart);
    }

    // Hero buttons (home page)
    const shopNowBtn = document.querySelector('.hero-buttons .primary');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            document.querySelector('.featured-products').scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Setup cart functionality
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

// Setup authentication functionality
function setupAuthFunctionality() {
    // Setup tab switching
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

    // Setup form submissions
    const loginForm = document.querySelector('#loginForm form');
    const signupForm = document.querySelector('#signupForm form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Setup user icon click
    const userIcon = document.querySelector('.nav-icons .fa-user');
    if (userIcon && !isLoggedIn()) {
        userIcon.addEventListener('click', showLoginModal);
    }
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userEmail = currentUser.email || 'guest';
        const savedCart = localStorage.getItem(`cart_${userEmail}`);
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
        cartCount.style.display = 'none';
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
        cartCount.style.display = 'flex';
    }
}

// Display products (home page)
function displayProducts() {
    if (!productGrid) return;
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="navigateToProduct(${product.id})">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.brand}</h3>
            <h4>${product.name}</h4>
            <p class="price">$${product.price.toFixed(2)}</p>
            <button class="btn primary" onclick="addToCartAndStay(event, ${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

// Navigate to product page
function navigateToProduct(productId) {
    window.location.href = `products.html?product=${productId}`;
}

// Add to cart without navigation
function addToCartAndStay(event, productId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    
    addToCart(productId);
}

// Add to cart
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email || 'guest';
    localStorage.setItem(`cart_${userEmail}`, JSON.stringify(window.cart));
}

// Authentication functions
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

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
        loadCart(); // Load user's specific cart
        showNotification('Successfully logged in!');
        updateNavigation();
    } else {
        showNotification('No matching account found. Please check your email and password.', true);
    }
}

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

function handleLogout() {
    saveCart(); // Save current cart before logging out
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.cart = []; // Clear cart from memory
    updateCartDisplay();
    
    // Force navigation update and cleanup
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        const originalUserIcon = document.createElement('a');
        originalUserIcon.href = '#account';
        originalUserIcon.innerHTML = '<i class="fas fa-user"></i>';
        originalUserIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
        userMenu.replaceWith(originalUserIcon);
    }
    
    showNotification('Successfully logged out!');
}

// Update navigation based on login state
function updateNavigation() {
    const userIconContainer = document.querySelector('.nav-icons a[href="#account"]');
    if (!userIconContainer) return;

    // Remove any existing user menu first
    const existingUserMenu = document.querySelector('.user-menu');
    if (existingUserMenu) {
        existingUserMenu.remove();
    }

    if (isLoggedIn()) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <i class="fas fa-user"></i>
            <div class="dropdown">
                <span>${currentUser.name}</span>
                <button onclick="handleLogout()">Logout</button>
            </div>
        `;
        userIconContainer.replaceWith(userMenu);
        
        // Toggle dropdown on click
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.querySelector('.dropdown').classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.querySelector('.user-menu .dropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }
        });
    } else {
        // Reset to original user icon if not logged in
        const originalUserIcon = document.createElement('a');
        originalUserIcon.href = '#account';
        originalUserIcon.innerHTML = '<i class="fas fa-user"></i>';
        
        // Add click event listener directly
        originalUserIcon.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });

        userIconContainer.replaceWith(originalUserIcon);
    }
}

// Products page specific functions
function getSelectedFilters() {
    if (!document.querySelector('.filter-group')) return { brands: [], priceRanges: [] };

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

function sortProducts(products) {
    if (!sortSelect) return products;
    
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

function resetFilters() {
    if (!filterCheckboxes || !sortSelect) return;
    
    filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    sortSelect.value = 'featured';
    displayFilteredProducts();
}

function saveFilterState() {
    if (!document.querySelector('.filter-group')) return;
    
    const filterState = {
        brands: Array.from(document.querySelectorAll('.filter-group input[type="checkbox"]'))
            .filter(input => input.checked)
            .map(input => input.value),
        sort: sortSelect ? sortSelect.value : 'featured'
    };
    sessionStorage.setItem('filterState', JSON.stringify(filterState));
}

function loadFilterState() {
    if (!document.querySelector('.filter-group')) return;
    
    const savedState = sessionStorage.getItem('filterState');
    if (savedState) {
        const filterState = JSON.parse(savedState);
        
        // Restore checkboxes
        filterState.brands.forEach(value => {
            const checkbox = document.querySelector(`.filter-group input[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Restore sort
        if (filterState.sort && sortSelect) {
            sortSelect.value = filterState.sort;
        }
        
        displayFilteredProducts();
    }
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

// Mobile filters toggle
if (window.innerWidth <= 768) {
    const mobileFilterBtn = document.createElement('button');
    mobileFilterBtn.className = 'btn secondary mobile-filter-btn';
    mobileFilterBtn.textContent = 'Filters';
    mobileFilterBtn.onclick = () => {
        document.querySelector('.filters-section').classList.toggle('active');
    };

    const productsHeader = document.querySelector('.products-header');
    if (productsHeader) {
        productsHeader.prepend(mobileFilterBtn);
    }
}

// Setup search functionality
function setupSearchFunctionality() {
    const searchIcon = document.querySelector('.nav-icons .fa-search');
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    
    if (searchIcon) {
        searchIcon.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            showSearchModal();
        });
    }

    // Close search modal when clicking outside
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                closeSearchModal();
            }
        });

        // Close button
        const closeBtn = searchModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSearchModal);
        }
    }

    // Search on enter key
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Show search modal
function showSearchModal() {
    const searchModal = document.getElementById('searchModal');
    const searchInput = document.getElementById('searchInput');
    if (searchModal) {
        searchModal.style.display = 'block';
        if (searchInput) {
            searchInput.focus();
        }
    }
}

// Close search modal
function closeSearchModal() {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.style.display = 'none';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }
}

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>Please enter a search term</p>
            </div>
        `;
        return;
    }

    const results = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>No products found matching "${query}"</p>
            </div>
        `;
    } else {
        searchResults.innerHTML = results.map(product => `
            <div class="search-result-item" onclick="navigateToProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}">
                <div class="search-result-details">
                    <h4>${product.brand} - ${product.name}</h4>
                    <p>$${product.price.toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }
}

// Show checkout modal
function showCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (checkoutModal) {
        // Pre-fill user information if available
        if (currentUser.email) {
            document.getElementById('email').value = currentUser.email;
            document.getElementById('fullName').value = currentUser.name || '';
        }
        
        // Update order summary
        updateOrderSummary();
        
        checkoutModal.style.display = 'block';
    }
}

// Close checkout modal
function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
        document.getElementById('checkoutForm').reset();
    }
}

// Update order summary in checkout modal
function updateOrderSummary() {
    const summaryItems = document.querySelector('.summary-items');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (!summaryItems || !summaryTotal) return;
    
    // Display cart items in summary
    summaryItems.innerHTML = window.cart.map(item => `
        <div class="summary-item">
            <div class="summary-item-details">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <p>Quantity: ${item.quantity}</p>
                </div>
            </div>
            <p>$${(item.price * item.quantity).toFixed(2)}</p>
        </div>
    `).join('');
    
    // Update total
    const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    summaryTotal.textContent = `$${total.toFixed(2)}`;
}

// Handle checkout form submission
function handleCheckout(e) {
    e.preventDefault();
    
    // Basic form validation
    const paymentMethod = document.getElementById('paymentMethod').value;
    if (paymentMethod === '') {
        showNotification('Please select a payment method', true);
        return;
    }
    
    // If card payment is selected, validate card details
    if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardNumber || !expiryDate || !cvv) {
            showNotification('Please fill in all card details', true);
            return;
        }
    }
    
    // Simulate order processing
    showNotification('Processing your order...', false);
    
    setTimeout(() => {
        // Clear cart
        window.cart = [];
        saveCart();
        updateCartDisplay();
        
        // Close modals
        closeCheckoutModal();
        toggleCart();
        
        // Show success message
        showNotification('Order placed successfully! Thank you for shopping with us.', false);
    }, 2000);
}

// Setup checkout functionality
function setupCheckoutFunctionality() {
    const checkoutForm = document.getElementById('checkoutForm');
    const paymentMethod = document.getElementById('paymentMethod');
    const cardDetails = document.getElementById('cardDetails');
    const checkoutModal = document.getElementById('checkoutModal');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    if (paymentMethod) {
        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'credit' || e.target.value === 'debit') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) {
                closeCheckoutModal();
            }
        });
        
        // Close button
        const closeBtn = checkoutModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeCheckoutModal);
        }
    }
}

// Update the cart footer in HTML to include the checkout button handler
const cartFooter = document.querySelector('.cart-footer');
if (cartFooter) {
    const checkoutBtn = cartFooter.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            if (!isLoggedIn()) {
                showNotification('Please log in to checkout', true);
                showLoginModal();
                return;
            }
            showCheckoutModal();
        };
    }
} 