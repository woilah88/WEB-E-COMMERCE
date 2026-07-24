// ==========================================
// LOGIKA CHECKOUT & AUTO-SAVE ALAMAT (checkout.js)
// ==========================================

// 1. Ambil Data Keranjang Belanja
let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];

// DOM Elements
const checkoutItemsList = document.getElementById("checkout-items-list");
const checkoutTotalPrice = document.getElementById("checkout-total-price");
const checkoutForm = document.getElementById("checkout-form");
const receiptModal = document.getElementById("receipt-modal");
const receiptDetails = document.getElementById("receipt-details");

// Form Inputs
const inputNama = document.getElementById("nama");
const inputPhone = document.getElementById("phone");
const inputAlamat = document.getElementById("alamat");
const inputPayment = document.getElementById("payment");

// Helper Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// ----------------------------------------------------
// 💡 FITUR KANTONG ALAMAT (AUTO-FILL SEPERTI SHOPEE/TOKOPEDIA)
// ----------------------------------------------------
function loadSavedAddress() {
  const savedAddress = JSON.parse(localStorage.getItem("USER_PROFILE_XEMA"));

  if (savedAddress) {
    inputNama.value = savedAddress.nama || "";
    inputPhone.value = savedAddress.phone || "";
    inputAlamat.value = savedAddress.alamat || "";
    if (savedAddress.payment) {
      inputPayment.value = savedAddress.payment;
    }
  }
}

// ----------------------------------------------------
// 2. Render Ringkasan Pesanan & Foto Barang
// ----------------------------------------------------
function renderCheckoutSummary() {
  if (cart.length === 0) {
    alert("Keranjang kamu kosong, silakan pilih produk dulu ya!");
    window.location.href = "../halaman utama/halaman utama.html";
    return;
  }

  checkoutItemsList.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("summary-item");
    itemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="summary-img">
      <div class="summary-info">
        <div class="summary-title">${item.name}</div>
        <div class="summary-qty">${item.quantity} x ${formatRupiah(item.price)}</div>
      </div>
      <div class="summary-price">${formatRupiah(subtotal)}</div>
    `;

    checkoutItemsList.appendChild(itemDiv);
  });

  checkoutTotalPrice.textContent = formatRupiah(total);
}

// ----------------------------------------------------
// 3. Handle Submit Form & Simpan Profil Pembeli
// ----------------------------------------------------
checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nama = inputNama.value.trim();
  const phone = inputPhone.value.trim();
  const alamat = inputAlamat.value.trim();
  const payment = inputPayment.value;

  // 💾 SIMPAN AUTOMATIS ALAMAT & PROFIL KE BROWSER PENGGUNA
  const userProfile = {
    nama: nama,
    phone: phone,
    alamat: alamat,
    payment: payment
  };
  localStorage.setItem("USER_PROFILE_XEMA", JSON.stringify(userProfile));

  // Hitung Total & Buat ID Pesanan
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const orderId = "XEMA-" + Math.floor(100000 + Math.random() * 900000);
  
  // Rincian Nota Struk Pengiriman
  receiptDetails.innerHTML = `
    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.6rem;">
      <p style="margin-bottom: 0.2rem;"><strong>ID Pesanan:</strong> <span style="color: #2563eb;">${orderId}</span></p>
      <p style="margin-bottom: 0.2rem;"><strong>Metode Bayar:</strong> ${payment}</p>
    </div>

    <!-- INFORMASI PENGIRIM -->
    <div style="margin-bottom: 0.6rem; background: #ffffff; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; margin-bottom: 0.2rem;">📦 Pengirim:</p>
      <p style="margin-bottom: 0.1rem;"><strong>XemaShop Official</strong></p>
      <p style="color: #64748b; font-size: 0.8rem;">0812-9999-8888 | Gudang Utama Jakarta</p>
    </div>

    <!-- INFORMASI PENERIMA -->
    <div style="margin-bottom: 0.6rem; background: #ffffff; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; margin-bottom: 0.2rem;">👤 Penerima Paket:</p>
      <p style="margin-bottom: 0.1rem;"><strong>${nama}</strong> (${phone})</p>
      <p style="color: #475569; font-size: 0.8rem;">${alamat}</p>
    </div>

    <!-- TOTAL -->
    <hr style="margin: 0.6rem 0; border: none; border-top: 1px dashed #cbd5e1;">
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
      <span>Total Bayar:</span>
      <span style="color: #2563eb; font-weight: bold; font-size: 1.1rem;">${formatRupiah(totalAmount)}</span>
    </div>
  `;

  // Tampilkan Modal Nota
  receiptModal.classList.add("active");
});

// ----------------------------------------------------
// 4. Selesaikan Pesanan (Reset Keranjang SAJA, Alamat Tetap Disimpan)
// ----------------------------------------------------
function finishOrder() {
  localStorage.removeItem("CART_XEMASHOP"); // Keranjang dibersihkan
  window.location.href = "../halaman utama/halaman utama.html";
}

// Inisialisasi awal saat halaman di-load
renderCheckoutSummary();
loadSavedAddress(); // Memanggil data alamat tersimpan