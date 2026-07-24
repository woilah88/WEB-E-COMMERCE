// ==========================================
// LOGIKA UTAMA: SEARCH, FILTER, & KERANJANG (app.js)
// ==========================================

// 1. Data Keranjang dari LocalStorage
let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];

// Element DOM Produk & Filter
const productContainer = document.getElementById("product-container");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");

// Element DOM Cart Drawer / Sidepanel
const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartCount = document.getElementById("cart-count");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");

let currentCategory = "all";
let currentSearchQuery = "";

// Helper Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// ==========================================
// A. RENDER PRODUK & FILTER
// ==========================================

function renderProducts() {
  if (!productContainer) return;
  productContainer.innerHTML = "";

  const filteredProducts = products.filter((product) => {
    const matchCategory = currentCategory === "all" || product.category.toUpperCase() === currentCategory.toUpperCase();
    const matchSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                        product.description.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin: 2rem 0;">Produk tidak ditemukan.</p>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-cart");
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-bottom">
          <span class="product-price">${formatRupiah(product.price)}</span>
          <button class="add-to-cart-btn" onclick="addToCart(${product.id})">+ Keranjang</button>
        </div>
      </div>
    `;
    productContainer.appendChild(productCard);
  });
}

// Event Search & Filter
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value.trim();
    renderProducts();
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentCategory = btn.getAttribute("data-category");
    renderProducts();
  });
});


// ==========================================
// B. MANAJEMEN KERANJANG BELANJA
// ==========================================

// 1. Tambah Produk ke Keranjang
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCartDrawer();
}

// 2. Simpan Keranjang ke LocalStorage
function saveCart() {
  localStorage.setItem("CART_XEMASHOP", JSON.stringify(cart));
}

// 3. Render Isi Keranjang
function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";

  let totalItemCount = 0;
  let totalPrice = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Keranjang kamu masih kosong.</p>`;
  } else {
    cart.forEach((item) => {
      totalItemCount += item.quantity;
      totalPrice += item.price * item.quantity;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("cart-item");
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatRupiah(item.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
          </div>
        </div>
        <button class="remove-item-btn" onclick="removeFromCart(${item.id})">Hapus</button>
      `;
      cartItemsContainer.appendChild(itemDiv);
    });
  }

  if (cartCount) cartCount.textContent = totalItemCount;
  if (cartTotalPrice) cartTotalPrice.textContent = formatRupiah(totalPrice);
}

// 4. Ubah Jumlah Quantity (+ / -)
function updateQuantity(productId, change) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
    renderCart();
  }
}

// 5. Hapus Produk dari Keranjang
function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
}

// ==========================================
// C. BUKA / TUTUP DRAWER KERANJANG & CHECKOUT
// ==========================================

function openCartDrawer() {
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
  }
}

function closeCartDrawer() {
  if (cartDrawer && cartOverlay) {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
  }
}

// Event Listeners Buka/Tutup Keranjang
if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

// Tombol Checkout Sekarang
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Keranjang belanja kamu masih kosong!");
      return;
    }
    window.location.href = "../checkout/checkout.html";
  });
}

// Inisialisasi awal saat halaman dimuat
renderProducts();
renderCart();