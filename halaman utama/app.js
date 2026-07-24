let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];

const productContainer = document.getElementById("product-container");
const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartCount = document.getElementById("cart-count");
const cartTotalPrice = document.getElementById("cart-total-price");
const searchInput = document.getElementById("search-input");
const checkoutBtn = document.getElementById("checkout-btn");

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

function renderProducts(productList) {
  productContainer.innerHTML = "";

  if (productList.length === 0) {
    productContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Produk tidak ditemukan.</p>`;
    return;
  }

  productList.forEach((product) => {
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

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart();
  toggleCart(true); 
}

function changeQuantity(productId, action) {
  const item = cart.find((item) => item.id === productId);

  if (!item) return;

  if (action === "increase") {
    item.quantity += 1;
  } else if (action === "decrease") {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
  }

  updateCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
}

function updateCart() {
  localStorage.setItem("CART_XEMASHOP", JSON.stringify(cart));
  renderCartItems();

  const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = totalCount;

  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  cartTotalPrice.textContent = formatRupiah(totalAmount);
}

function renderCartItems() {
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Keranjang kamu masih kosong.</p>`;
    return;
  }

  cart.forEach((item) => {
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");

    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">${formatRupiah(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQuantity(${item.id}, 'decrease')">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="changeQuantity(${item.id}, 'increase')">+</button>
        </div>
      </div>
      <button class="remove-item-btn" onclick="removeFromCart(${item.id})">Hapus</button>
    `;

    cartItemsContainer.appendChild(cartItem);
  });
}

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  });
  renderProducts(filteredProducts);
});

function toggleCart(isOpen) {
  if (isOpen) {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
  } else {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
  }
}

cartBtn.addEventListener("click", () => toggleCart(true));
closeCartBtn.addEventListener("click", () => toggleCart(false));
cartOverlay.addEventListener("click", () => toggleCart(false));

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Keranjang kamu masih kosong, pilih produk dulu ya!");
    return;
  }

  // Pindah keluar dari folder "halaman utama" menuju folder "checkout/checkout.html"
  window.location.href = "../checkout/checkout.html";
});

renderProducts(products);
updateCart();