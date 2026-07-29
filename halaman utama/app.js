// ==========================================
// LOGIKA UTAMA: SEARCH, FILTER, SORTING, & KERANJANG (app.js)
// ==========================================

// 1. Data Keranjang dari LocalStorage
let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];

// Element DOM Produk, Filter, & Sorting
const productContainer = document.getElementById("product-container");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");

// Element DOM Cart Drawer / Sidepanel
const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartCount = document.getElementById("cart-count");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");

// Element DOM Modal Detail
const detailModal = document.getElementById("product-detail-modal");
const closeDetailBtn = document.getElementById("close-detail-btn");
const detailBody = document.getElementById("product-detail-body");

let currentCategory = "all";
let currentSearchQuery = "";
let currentSortOption = "default";

// Helper Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// ==========================================
// A. RENDER PRODUK, FILTER, & SORTING
// ==========================================

function renderProducts() {
  if (!productContainer) return;
  productContainer.innerHTML = "";

  // 1. Filter Kategori & Pencarian
  let filteredProducts = products.filter((product) => {
    const matchCategory = currentCategory === "all" || product.category.toUpperCase() === currentCategory.toUpperCase();
    const matchSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                        product.description.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 2. Sorting Berdasarkan Harga
  if (currentSortOption === "lowest") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (currentSortOption === "highest") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin: 2rem 0;">Produk tidak ditemukan.</p>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-cart");
    
    // Cek apakah ada diskon produk
    const hasDiscount = product.discountPercent && product.originalPrice;
    
    productCard.innerHTML = `
      <div class="product-image-wrapper" onclick="openProductDetail(${product.id})" style="cursor: pointer;">
        ${hasDiscount ? `<span class="discount-badge">-${product.discountPercent}%</span>` : ''}
        <img src="${product.image}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        <h3 class="product-title" onclick="openProductDetail(${product.id})" style="cursor: pointer;">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-bottom">
          <div class="product-price-container">
            ${hasDiscount ? `<span class="original-price">${formatRupiah(product.originalPrice)}</span>` : ''}
            <span class="discount-price">${formatRupiah(product.price)}</span>
          </div>
          <button class="add-to-cart-btn" onclick="addToCart(${product.id})">+ Keranjang</button>
        </div>
      </div>
    `;
    productContainer.appendChild(productCard);
  });
}

// Event Listeners Search, Filter, & Sorting
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

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    currentSortOption = e.target.value;
    renderProducts();
  });
}


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
  showToast(`${product.name} berhasil ditambahkan!`);
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

if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Keranjang belanja kamu masih kosong!");
      return;
    }
    window.location.href = "../checkout/checkout.html";
  });
}

// ==========================================
// D. LOGIKA CAROUSEL SLIDER BANNER PROMO
// ==========================================
let slideIndex = 0;
let slideTimer;

function showSlides(n) {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".dot");

  if (!slides.length) return;

  if (n !== undefined) {
    slideIndex = n;
  } else {
    slideIndex++;
  }

  if (slideIndex >= slides.length) { slideIndex = 0; }
  if (slideIndex < 0) { slideIndex = slides.length - 1; }

  slides.forEach(slide => slide.style.display = "none");
  dots.forEach(dot => dot.classList.remove("active"));

  slides[slideIndex].style.display = "block";
  if (dots[slideIndex]) dots[slideIndex].classList.add("active");

  clearTimeout(slideTimer);
  slideTimer = setTimeout(showSlides, 5000);
}

function moveSlide(step) {
  showSlides(slideIndex + step);
}

function currentSlide(index) {
  showSlides(index);
}

// ==========================================
// E. LOGIKA TOAST NOTIFICATION
// ==========================================
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.innerHTML = `<span>✅</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// ==========================================
// F. LOGIKA MODAL DETAIL PRODUK + UKURAN DINAMIS
// ==========================================
function openProductDetail(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product || !detailModal || !detailBody) return;

  const hasDiscount = product.discountPercent && product.originalPrice;

  // Ukuran Dinamis Berdasarkan Kategori
  let sizeLabel = "Pilih Ukuran:";
  let sizesList = [];

  if (product.category.toUpperCase() === "SEPATU") {
    sizeLabel = "Pilih Ukuran Sepatu (EU):";
    sizesList = ["39", "40", "41", "42", "43"];
  } else if (product.category.toUpperCase() === "PAKAIAN") {
    sizeLabel = "Pilih Ukuran Baju:";
    sizesList = ["S", "M", "L", "XL"];
  } else {
    sizeLabel = "Pilihan Ukuran:";
    sizesList = ["All Size"];
  }

  const sizeButtonsHTML = sizesList
    .map((size, index) => `<button type="button" class="size-btn ${index === 0 ? 'active' : ''}">${size}</button>`)
    .join("");

  detailBody.innerHTML = `
    <div class="detail-img-wrapper">
      ${hasDiscount ? `<span class="discount-badge">-${product.discountPercent}%</span>` : ''}
      <img src="${product.image}" alt="${product.name}" class="detail-img">
    </div>
    <div class="detail-info">
      <span class="product-category">${product.category}</span>
      <h2 class="detail-title">${product.name}</h2>
      
      <div class="product-price-container">
        ${hasDiscount ? `<span class="original-price">${formatRupiah(product.originalPrice)}</span>` : ''}
        <span class="discount-price">${formatRupiah(product.price)}</span>
      </div>

      <p class="detail-desc">${product.description} Terbuat dari bahan berkualitas tinggi yang nyaman digunakan sehari-hari.</p>

      <div class="size-selector">
        <label>${sizeLabel}</label>
        <div class="size-options">
          ${sizeButtonsHTML}
        </div>
      </div>

      <button class="add-to-cart-btn" style="width: 100%; margin-top: 0.5rem; padding: 0.7rem;" onclick="addToCart(${product.id}); closeProductDetail();">
        + Masukkan ke Keranjang
      </button>
    </div>
  `;

  // Event klik ganti warna aktif pada tombol ukuran
  const sizeBtns = detailBody.querySelectorAll(".size-btn");
  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  detailModal.classList.add("active");
}

function closeProductDetail() {
  if (detailModal) detailModal.classList.remove("active");
}

if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeProductDetail);
if (detailModal) {
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeProductDetail();
  });
}

// ==========================================
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  showSlides(0);
});