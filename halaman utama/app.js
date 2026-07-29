// ==========================================
// LOGIKA UTAMA: KATALOG, RATING, WISHLIST, RIWAYAT, DARK MODE, & KERANJANG (app.js)
// ==========================================

// 1. Data LocalStorage
let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];
let wishlist = JSON.parse(localStorage.getItem("WISHLIST_XEMASHOP")) || [];

// Element DOM Produk & Sorting
const productContainer = document.getElementById("product-container");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");

// Element DOM Cart Drawer
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
const productReviewsContainer = document.getElementById("product-reviews-container");

// Element DOM Wishlist Modal
const wishlistBtn = document.getElementById("wishlist-btn");
const wishlistCount = document.getElementById("wishlist-count");
const wishlistModal = document.getElementById("wishlist-modal");
const closeWishlistBtn = document.getElementById("close-wishlist-btn");
const wishlistItemsContainer = document.getElementById("wishlist-items-container");

// Element DOM Riwayat Pembelian
const historyBtn = document.getElementById("history-btn");
const historyModal = document.getElementById("history-modal");
const closeHistoryBtn = document.getElementById("close-history-btn");
const historyItemsContainer = document.getElementById("history-items-container");

// Element DOM Dark Mode
const darkModeToggle = document.getElementById("dark-mode-toggle");

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

  let filteredProducts = products.filter((product) => {
    const matchCategory = currentCategory === "all" || product.category.toUpperCase() === currentCategory.toUpperCase();
    const matchSearch = product.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
                        product.description.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (currentSortOption === "lowest") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (currentSortOption === "highest") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin: 2rem 0;">Produk tidak ditemukan.</p>`;
    return;
  }

  // Hitung statistik rating secara DINAMIS dari ORDER_HISTORY_XEMA
  const orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  const ratingsMap = {};

  orderHistory.forEach(order => {
    order.items.forEach(item => {
      const pId = Number(item.id);
      if (item.userRating && item.userRating > 0) {
        if (!ratingsMap[pId]) {
          ratingsMap[pId] = { totalStars: 0, reviewsCount: 0 };
        }
        ratingsMap[pId].totalStars += Number(item.userRating);
        ratingsMap[pId].reviewsCount += 1;
      }
    });
  });

  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-cart");
    
    const hasDiscount = product.discountPercent && product.originalPrice;
    const isWishlisted = wishlist.includes(Number(product.id));
    
    const pId = Number(product.id);
    const productStats = ratingsMap[pId] || { totalStars: 0, reviewsCount: 0 };
    const count = productStats.reviewsCount;
    const avgRating = count > 0 ? (productStats.totalStars / count).toFixed(1) : '0.0';

    productCard.innerHTML = `
      <div class="product-image-wrapper">
        ${hasDiscount ? `<span class="discount-badge">-${product.discountPercent}%</span>` : ''}
        
        <button class="wishlist-heart-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(event, ${product.id})" title="Tambah/Hapus Favorit">
          ${isWishlisted ? '❤️' : '🤍'}
        </button>

        <img src="${product.image}" alt="${product.name}" class="product-image" onclick="openProductDetail(${product.id})" style="cursor: pointer;">
      </div>
      <div class="product-info">
        <span class="product-category">${product.category}</span>
        
        <div class="product-rating">
          <span class="rating-stars">⭐ ${avgRating}</span>
          <span class="rating-count">(${count})</span>
        </div>

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
// B. LOGIKA WISHLIST / FAVORIT PRODUK
// ==========================================

function toggleWishlist(event, productId) {
  if (event) event.stopPropagation();

  const id = Number(productId);
  const index = wishlist.indexOf(id);

  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(id);
  }

  localStorage.setItem("WISHLIST_XEMASHOP", JSON.stringify(wishlist));
  updateWishlistUI();
  renderProducts();
}

function updateWishlistUI() {
  if (wishlistCount) wishlistCount.textContent = wishlist.length;

  if (!wishlistItemsContainer) return;
  wishlistItemsContainer.innerHTML = "";

  if (wishlist.length === 0) {
    wishlistItemsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin: 1.5rem 0;">Belum ada produk favorit.</p>`;
    return;
  }

  wishlist.forEach((id) => {
    const product = products.find(p => Number(p.id) === Number(id));
    if (!product) return;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("wishlist-item-card");
    itemDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="wishlist-item-img">
      <div style="flex-grow: 1;">
        <h4 style="font-size: 0.95rem;">${product.name}</h4>
        <p style="color: var(--primary-color); font-weight: bold; font-size: 0.9rem;">${formatRupiah(product.price)}</p>
      </div>
      <button class="add-to-cart-btn" style="padding: 0.4rem 0.7rem;" onclick="addToCart(${product.id})">+ Keranjang</button>
      <button style="background: none; border: none; font-size: 1.2rem; cursor: pointer;" onclick="toggleWishlist(null, ${product.id})">🗑️</button>
    `;
    wishlistItemsContainer.appendChild(itemDiv);
  });
}

if (wishlistBtn) {
  wishlistBtn.addEventListener("click", () => {
    updateWishlistUI();
    if (wishlistModal) wishlistModal.classList.add("active");
  });
}

if (closeWishlistBtn) {
  closeWishlistBtn.addEventListener("click", () => {
    if (wishlistModal) wishlistModal.classList.remove("active");
  });
}

// ==========================================
// C. LOGIKA RIWAYAT PEMBELIAN & FORM RATING FOTO/VIDEO/KOMENTAR
// ==========================================

function renderHistory() {
  if (!historyItemsContainer) return;
  
  const orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  historyItemsContainer.innerHTML = "";

  if (orderHistory.length === 0) {
    historyItemsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin: 2rem 0;">Belum ada riwayat transaksi pembelian.</p>`;
    return;
  }

  orderHistory.forEach((order, orderIndex) => {
    const orderCard = document.createElement("div");
    orderCard.classList.add("history-order-card");

    let productsHTML = "";
    order.items.forEach((item, itemIndex) => {
      let starsHTML = "";
      for (let i = 1; i <= 5; i++) {
        const isActive = i <= (item.userRating || 0) ? "active" : "";
        starsHTML += `<span class="${isActive}" onclick="setTempStar(${orderIndex}, ${itemIndex}, ${i})">⭐</span>`;
      }

      productsHTML += `
        <div class="history-product-item">
          <div class="history-product-main">
            <img src="${item.image}" alt="${item.name}" class="history-product-img">
            <div style="flex-grow: 1;">
              <h4 style="font-size: 0.9rem; color: var(--text-dark);">${item.name} (${item.quantity}x)</h4>
              <p style="font-size: 0.8rem; color: var(--primary-color); font-weight: bold;">${formatRupiah(item.price)}</p>
              
              <div style="margin-top: 0.2rem;">
                <span style="font-size: 0.75rem; color: var(--text-muted);">
                  ${item.userRating ? `Bintang Kamu: ${item.userRating}/5` : 'Pilih Bintang:'}
                </span>
                <div class="star-rating-input">
                  ${starsHTML}
                </div>
              </div>
            </div>
          </div>

          <!-- FORM ULASAN KOMPLIT SHOPEE (KOMENTAR, FOTO, VIDEO) -->
          <div class="review-form-box">
            <textarea id="comment-${orderIndex}-${itemIndex}" class="review-textarea" placeholder="Tulis ulasan produk disini... (contoh: Bahannya bagus banget, respon cepat!)">${item.userComment || ''}</textarea>
            
            <div class="review-media-upload">
              <label class="upload-btn-label">
                📷 Tambah Foto
                <input type="file" id="photo-${orderIndex}-${itemIndex}" accept="image/*" style="display: none;" onchange="previewUploadName(this, 'photo-name-${orderIndex}-${itemIndex}')">
              </label>
              <span id="photo-name-${orderIndex}-${itemIndex}" style="font-size: 0.75rem; color: var(--text-muted);">${item.userPhoto ? '✅ Foto Terupload' : ''}</span>

              <label class="upload-btn-label">
                🎥 Tambah Video
                <input type="file" id="video-${orderIndex}-${itemIndex}" accept="video/*" style="display: none;" onchange="previewUploadName(this, 'video-name-${orderIndex}-${itemIndex}')">
              </label>
              <span id="video-name-${orderIndex}-${itemIndex}" style="font-size: 0.75rem; color: var(--text-muted);">${item.userVideo ? '✅ Video Terupload' : ''}</span>
            </div>

            <button class="submit-review-btn" onclick="saveFullReview(${orderIndex}, ${itemIndex}, ${item.id})">
              ${item.userRating ? '🔄 Perbarui Ulasan' : '🚀 Kirim Ulasan'}
            </button>
          </div>
        </div>
      `;
    });

    orderCard.innerHTML = `
      <div class="history-order-header">
        <span><strong>ID:</strong> ${order.orderId}</span>
        <span>${order.date}</span>
      </div>
      <div>${productsHTML}</div>
    `;

    historyItemsContainer.appendChild(orderCard);
  });
}

function setTempStar(orderIndex, itemIndex, starVal) {
  let orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  orderHistory[orderIndex].items[itemIndex].userRating = starVal;
  localStorage.setItem("ORDER_HISTORY_XEMA", JSON.stringify(orderHistory));
  renderHistory();
}

function previewUploadName(input, spanId) {
  const span = document.getElementById(spanId);
  if (input.files && input.files[0] && span) {
    span.textContent = `✅ ${input.files[0].name.substring(0, 15)}...`;
  }
}

function saveFullReview(orderIndex, itemIndex, productId) {
  let orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  const item = orderHistory[orderIndex].items[itemIndex];

  if (!item.userRating || item.userRating === 0) {
    alert("Silakan beri rating bintang terlebih dahulu ya!");
    return;
  }

  const commentText = document.getElementById(`comment-${orderIndex}-${itemIndex}`).value.trim();
  const photoInput = document.getElementById(`photo-${orderIndex}-${itemIndex}`);
  const videoInput = document.getElementById(`video-${orderIndex}-${itemIndex}`);

  item.userComment = commentText;

  const processFiles = () => {
    localStorage.setItem("ORDER_HISTORY_XEMA", JSON.stringify(orderHistory));
    alert("Ulasan kamu berhasil disimpan!");
    renderHistory();
    renderProducts();
  };

  let filePromises = [];

  if (photoInput && photoInput.files[0]) {
    filePromises.push(new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        item.userPhoto = e.target.result;
        resolve();
      };
      reader.readAsDataURL(photoInput.files[0]);
    }));
  }

  if (videoInput && videoInput.files[0]) {
    filePromises.push(new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        item.userVideo = e.target.result;
        resolve();
      };
      reader.readAsDataURL(videoInput.files[0]);
    }));
  }

  if (filePromises.length > 0) {
    Promise.all(filePromises).then(processFiles);
  } else {
    processFiles();
  }
}

if (historyBtn) {
  historyBtn.addEventListener("click", () => {
    renderHistory();
    if (historyModal) historyModal.classList.add("active");
  });
}

if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener("click", () => {
    if (historyModal) historyModal.classList.remove("active");
  });
}

// ==========================================
// D. LOGIKA DARK MODE TOGGLE
// ==========================================

function initDarkMode() {
  const isDarkMode = localStorage.getItem("DARK_MODE_XEMA") === "true";
  
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    if (darkModeToggle) darkModeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark-mode");
    if (darkModeToggle) darkModeToggle.textContent = "🌙";
  }
}

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const activeDark = document.body.classList.contains("dark-mode");
    
    localStorage.setItem("DARK_MODE_XEMA", activeDark);
    darkModeToggle.textContent = activeDark ? "☀️" : "🌙";
  });
}

// ==========================================
// E. MANAJEMEN KERANJANG BELANJA
// ==========================================

function addToCart(productId) {
  const id = Number(productId);
  const product = products.find((p) => Number(p.id) === id);
  if (!product) return;

  const existingItem = cart.find((item) => Number(item.id) === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: Number(product.id),
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

function saveCart() {
  localStorage.setItem("CART_XEMASHOP", JSON.stringify(cart));
}

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

function updateQuantity(productId, change) {
  const id = Number(productId);
  const item = cart.find((i) => Number(i.id) === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    renderCart();
  }
}

function removeFromCart(productId) {
  const id = Number(productId);
  cart = cart.filter((item) => Number(item.id) !== id);
  saveCart();
  renderCart();
}

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
// F. BANNER CAROUSEL
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
// G. MODAL DETAIL PRODUK + SECTION ULASAN PEMBELI (SHOPEE STYLE)
// ==========================================
function openProductDetail(productId) {
  const id = Number(productId);
  const product = products.find((p) => Number(p.id) === id);
  if (!product || !detailModal || !detailBody) return;

  const hasDiscount = product.discountPercent && product.originalPrice;

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

  // Hitung ulang dinamis ulasan
  const orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  let totalStars = 0;
  let count = 0;
  let reviewsList = [];

  orderHistory.forEach(order => {
    order.items.forEach(item => {
      if (Number(item.id) === id && item.userRating && item.userRating > 0) {
        totalStars += Number(item.userRating);
        count += 1;

        reviewsList.push({
          date: order.date,
          rating: item.userRating,
          comment: item.userComment || "Tidak ada ulasan tertulis.",
          photo: item.userPhoto || null,
          video: item.userVideo || null
        });
      }
    });
  });

  const avgRating = count > 0 ? (totalStars / count).toFixed(1) : '0.0';

  detailBody.innerHTML = `
    <div class="detail-img-wrapper">
      ${hasDiscount ? `<span class="discount-badge">-${product.discountPercent}%</span>` : ''}
      <img src="${product.image}" alt="${product.name}" class="detail-img">
    </div>
    <div class="detail-info">
      <span class="product-category">${product.category}</span>
      <h2 class="detail-title">${product.name}</h2>
      
      <div class="product-rating" style="font-size: 0.9rem; margin-bottom: 0.5rem;">
        <span class="rating-stars">⭐ ${avgRating}</span>
        <span class="rating-count">(${count} ulasan pembeli)</span>
      </div>

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

  // Render Daftar Komentar + Foto + Video di Modal
  if (productReviewsContainer) {
    productReviewsContainer.innerHTML = "";
    if (reviewsList.length === 0) {
      productReviewsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">Belum ada ulasan tertulis untuk produk ini.</p>`;
    } else {
      reviewsList.forEach(rev => {
        let starsStr = "⭐".repeat(rev.rating);
        const revDiv = document.createElement("div");
        revDiv.classList.add("review-card");

        let mediaHTML = "";
        if (rev.photo || rev.video) {
          mediaHTML += `<div class="review-media-container">`;
          if (rev.photo) mediaHTML += `<img src="${rev.photo}" class="review-media-img" onclick="window.open('${rev.photo}')">`;
          if (rev.video) mediaHTML += `<video src="${rev.video}" class="review-media-video" controls></video>`;
          mediaHTML += `</div>`;
        }

        revDiv.innerHTML = `
          <div class="review-card-header">
            <span class="review-user-name">Pembeli XemaShop (${rev.date})</span>
            <span style="font-size: 0.8rem;">${starsStr}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-dark);">${rev.comment}</p>
          ${mediaHTML}
        `;
        productReviewsContainer.appendChild(revDiv);
      });
    }
  }

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
  initDarkMode();
  renderProducts();
  renderCart();
  updateWishlistUI();
  showSlides(0);
});