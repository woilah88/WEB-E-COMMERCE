// ======================================================
// LOGIKA CHECKOUT + ONGKIR + VOUCHER + WHATSAPP + RIWAYAT PEMBELIAN (checkout.js)
// ======================================================

// 1. Ambil Data Keranjang dari LocalStorage
let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];

// Element DOM Utama
const checkoutItemsList = document.getElementById("checkout-items-list");
const checkoutTotalPrice = document.getElementById("checkout-total-price");
const checkoutForm = document.getElementById("checkout-form");
const receiptModal = document.getElementById("receipt-modal");
const receiptDetails = document.getElementById("receipt-details");

const inputNama = document.getElementById("nama");
const inputPhone = document.getElementById("phone");
const inputAlamat = document.getElementById("alamat");
const inputPayment = document.getElementById("payment");
const inputCourier = document.getElementById("courier");

const voucherInput = document.getElementById("voucher-input");
const applyVoucherBtn = document.getElementById("apply-voucher-btn");
const voucherMessage = document.getElementById("voucher-message");

let activeDiscount = 0;
const validVouchers = {
  "XEMA2026": 20000,   // Potongan Rp 20.000
  "HEMAT10": 10000,    // Potongan Rp 10.000
  "XEMAPROMO": 50000   // Potongan Rp 50.000
};

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

// 2. Load Data Profil Tersimpan (Auto-Fill)
function loadSavedAddress() {
  const savedAddress = JSON.parse(localStorage.getItem("USER_PROFILE_XEMA"));
  if (savedAddress) {
    inputNama.value = savedAddress.nama || "";
    inputPhone.value = savedAddress.phone || "";
    inputAlamat.value = savedAddress.alamat || "";
    if (savedAddress.payment) inputPayment.value = savedAddress.payment;
    if (savedAddress.courier) inputCourier.value = savedAddress.courier;
  }
}

// 3. Render Barang & Hitung Subtotal + Ongkir - Diskon = Total
function renderCheckoutSummary() {
  if (cart.length === 0) {
    alert("Keranjang kamu kosong, silakan pilih produk dulu ya!");
    window.location.href = "../halaman utama/halaman utama.html";
    return;
  }

  checkoutItemsList.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item) => {
    const itemSubtotal = item.price * item.quantity;
    subtotal += itemSubtotal;

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("summary-item");
    itemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="summary-img">
      <div class="summary-info">
        <div class="summary-title">${item.name}</div>
        <div class="summary-qty">${item.quantity} x ${formatRupiah(item.price)}</div>
      </div>
      <div class="summary-price">${formatRupiah(itemSubtotal)}</div>
    `;
    checkoutItemsList.appendChild(itemDiv);
  });

  // Ambil Nilai Ongkir dari Dropdown Kurir
  const courierValue = inputCourier.value.split("|");
  const courierName = courierValue[0];
  const ongkirPrice = parseInt(courierValue[1]) || 0;

  // Hitung Total Pembayaran
  let grandTotal = (subtotal + ongkirPrice) - activeDiscount;
  if (grandTotal < 0) grandTotal = 0;

  // DOM Elements Rincian
  const subtotalElem = document.getElementById("checkout-subtotal");
  const ongkirElem = document.getElementById("checkout-ongkir");
  const courierLabelElem = document.getElementById("courier-label-display");
  const discountRow = document.getElementById("discount-row");
  const checkoutDiscount = document.getElementById("checkout-discount");

  if (subtotalElem) subtotalElem.textContent = formatRupiah(subtotal);
  if (ongkirElem) ongkirElem.textContent = formatRupiah(ongkirPrice);
  if (courierLabelElem) courierLabelElem.textContent = `Ongkir (${courierName}):`;

  if (discountRow && checkoutDiscount) {
    if (activeDiscount > 0) {
      discountRow.style.display = "flex";
      checkoutDiscount.textContent = `-${formatRupiah(activeDiscount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }

  if (checkoutTotalPrice) {
    checkoutTotalPrice.textContent = formatRupiah(grandTotal);
  }
}

// Event Listener Kurir
if (inputCourier) {
  inputCourier.addEventListener("change", renderCheckoutSummary);
}

// 4. Logika Klaim Kode Voucher
if (applyVoucherBtn) {
  applyVoucherBtn.addEventListener("click", () => {
    const code = voucherInput.value.trim().toUpperCase();

    if (validVouchers[code]) {
      activeDiscount = validVouchers[code];
      voucherMessage.style.display = "block";
      voucherMessage.style.color = "#10b981";
      voucherMessage.textContent = ` Voucher "${code}" berhasil digunakan! Diskon ${formatRupiah(activeDiscount)}`;
    } else {
      activeDiscount = 0;
      voucherMessage.style.display = "block";
      voucherMessage.style.color = "#ef4444";
      voucherMessage.textContent = "❌ Kode voucher tidak valid atau sudah kadaluarsa.";
    }
    renderCheckoutSummary();
  });
}

// 5. Handle Submit Form Pembelian
checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nama = inputNama.value.trim();
  const phone = inputPhone.value.trim();
  const alamat = inputAlamat.value.trim();
  const payment = inputPayment.value;
  
  const [courierName, courierPriceStr] = inputCourier.value.split("|");
  const ongkirPrice = parseInt(courierPriceStr) || 0;

  localStorage.setItem("USER_PROFILE_XEMA", JSON.stringify({
    nama, phone, alamat, payment, courier: inputCourier.value
  }));

  const subtotalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let grandTotal = (subtotalAmount + ongkirPrice) - activeDiscount;
  if (grandTotal < 0) grandTotal = 0;

  const orderId = "XEMA-" + Math.floor(100000 + Math.random() * 900000);

  // SIMPAN KE RIWAYAT PEMBELIAN (PURCHASE HISTORY)
  let orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
  const newOrder = {
    orderId: orderId,
    date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      userRating: 0
    }))
  };

  orderHistory.unshift(newOrder);
  localStorage.setItem("ORDER_HISTORY_XEMA", JSON.stringify(orderHistory));

  receiptDetails.innerHTML = `
    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.6rem;">
      <p style="margin-bottom: 0.2rem;"><strong>ID Pesanan:</strong> <span style="color: #2563eb;">${orderId}</span></p>
      <p style="margin-bottom: 0.2rem;"><strong>Metode Bayar:</strong> ${payment}</p>
      <p style="margin-bottom: 0.2rem;"><strong>Pengiriman:</strong> ${courierName} (${formatRupiah(ongkirPrice)})</p>
      ${activeDiscount > 0 ? `<p style="margin-bottom: 0.2rem; color: #10b981;"><strong>Diskon Voucher:</strong> -${formatRupiah(activeDiscount)}</p>` : ''}
    </div>

    <div style="margin-bottom: 0.6rem; background: #ffffff; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; margin-bottom: 0.2rem;">📦 Pengirim:</p>
      <p style="margin-bottom: 0.1rem;"><strong>XemaShop Official</strong></p>
      <p style="color: #64748b; font-size: 0.8rem;">0812-9999-8888 | Gudang Utama Jakarta</p>
    </div>

    <div style="margin-bottom: 0.6rem; background: #ffffff; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: bold; margin-bottom: 0.2rem;">👤 Penerima Paket:</p>
      <p style="margin-bottom: 0.1rem;"><strong>${nama}</strong> (${phone})</p>
      <p style="color: #475569; font-size: 0.8rem;">${alamat}</p>
    </div>

    <hr style="margin: 0.6rem 0; border: none; border-top: 1px dashed #cbd5e1;">
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
      <span>Total Akhir:</span>
      <span style="color: #2563eb; font-weight: bold; font-size: 1.1rem;">${formatRupiah(grandTotal)}</span>
    </div>
  `;

  const adminWaNumber = "6285124164662";

  let itemDetailsText = "";
  cart.forEach(item => {
    itemDetailsText += `- ${item.name} (${item.quantity}x)\n`;
  });

  const waText = 
`Halo XemaShop! Saya ingin mengonfirmasi pesanan saya:

*ID Pesanan:* ${orderId}
*Nama:* ${nama}
*No. WA:* ${phone}
*Alamat:* ${alamat}
*Pengiriman:* ${courierName}
*Metode Bayar:* ${payment}

*Rincian Barang:*
${itemDetailsText}
*Subtotal:* ${formatRupiah(subtotalAmount)}
*Ongkir:* ${formatRupiah(ongkirPrice)}
*Diskon Voucher:* ${formatRupiah(activeDiscount)}
*Total Akhir:* ${formatRupiah(grandTotal)}

Mohon diproses ya, terima kasih!`;

  const waBtn = document.getElementById("wa-btn");
  if (waBtn) {
    waBtn.href = `https://wa.me/${adminWaNumber}?text=${encodeURIComponent(waText)}`;
  }

  receiptModal.classList.add("active");
});

// 6. Selesai Order & Reset Keranjang
function finishOrder() {
  localStorage.removeItem("CART_XEMASHOP");
  window.location.href = "../halaman utama/halaman utama.html";
}

loadSavedAddress();
renderCheckoutSummary();