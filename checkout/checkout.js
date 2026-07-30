// ==========================================
// LOGIKA CHECKOUT & SIMPAN RIWAYAT TRANSAKSI (checkout.js)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Ambil data keranjang dari LocalStorage
  let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];
  
  // Element DOM Form & Ringkasan
  const checkoutItemsContainer = document.getElementById("checkout-items-container");
  const subtotalElement = document.getElementById("checkout-subtotal");
  const shippingCostElement = document.getElementById("checkout-shipping-cost");
  const totalPaymentElement = document.getElementById("checkout-total-payment");
  const shippingSelect = document.getElementById("shipping-select");
  const checkoutForm = document.getElementById("checkout-form");
  
  // Element DOM Modal Nota / Invoice
  const invoiceModal = document.getElementById("invoice-modal");
  const invoiceContent = document.getElementById("invoice-content");
  const confirmWaBtn = document.getElementById("confirm-wa-btn");
  const backToHomeBtn = document.getElementById("back-to-home-btn");

  // Jika keranjang kosong dan mencoba buka checkout, balikkan ke katalog
  if (cart.length === 0 && !invoiceModal?.classList.contains("active")) {
    alert("Keranjang belanja kamu masih kosong!");
    window.location.href = "../halaman utama/halaman utama.html";
    return;
  }

  // Helper Format Rupiah
  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  // 2. Render Ringkasan Pesanan di Samping Form
  function renderCheckoutSummary() {
    if (!checkoutItemsContainer) return;
    checkoutItemsContainer.innerHTML = "";

    let subtotal = 0;

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("checkout-item-card");
      itemDiv.style.cssText = "display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.8rem;";
      
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
        <div style="flex-grow: 1;">
          <h4 style="font-size: 0.85rem; margin-bottom: 0.2rem;">${item.name}</h4>
          <p style="font-size: 0.75rem; color: var(--text-muted);">${item.quantity} x ${formatRupiah(item.price)}</p>
        </div>
        <strong style="font-size: 0.85rem; color: var(--primary-color);">${formatRupiah(itemTotal)}</strong>
      `;
      checkoutItemsContainer.appendChild(itemDiv);
    });

    const shippingCost = Number(shippingSelect ? shippingSelect.value : 10000);
    const grandTotal = subtotal + shippingCost;

    if (subtotalElement) subtotalElement.textContent = formatRupiah(subtotal);
    if (shippingCostElement) shippingCostElement.textContent = formatRupiah(shippingCost);
    if (totalPaymentElement) totalPaymentElement.textContent = formatRupiah(grandTotal);
  }

  // Update total saat jasa pengiriman diubah
  if (shippingSelect) {
    shippingSelect.addEventListener("change", renderCheckoutSummary);
  }

  // 3. Proses 'Konfirmasi & Bayar Sekarang'
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Ambil nilai dari inputan
      const name = document.getElementById("input-name").value.trim();
      const phone = document.getElementById("input-phone").value.trim();
      const address = document.getElementById("input-address").value.trim();
      const shippingOption = shippingSelect.options[shippingSelect.selectedIndex].text;
      const shippingCost = Number(shippingSelect.value);
      const paymentMethod = document.getElementById("payment-select").value;

      let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let totalAmount = subtotal + shippingCost;

      // Buat ID Pesanan Acak (contoh: XEMA-463926)
      const orderId = "XEMA-" + Math.floor(100000 + Math.random() * 900000);
      const todayDate = new Date().toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Bikin objek data pesanan
      const orderData = {
        orderId: orderId,
        date: todayDate,
        customerName: name,
        customerPhone: phone,
        address: address,
        shippingOption: shippingOption,
        paymentMethod: paymentMethod,
        subtotal: subtotal,
        shippingCost: shippingCost,
        totalAmount: totalAmount,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          userRating: 0,
          userComment: "",
          userPhoto: null,
          userVideo: null
        }))
      };

      // A. SIMPAN KE RIWAYAT TRANSAKSI (ORDER_HISTORY_XEMA)
      let history = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
      history.unshift(orderData); // Taruh pesanan paling baru di atas
      localStorage.setItem("ORDER_HISTORY_XEMA", JSON.stringify(history));

      // B. KOSONGKAN KERANJANG
      localStorage.removeItem("CART_XEMASHOP");

      // C. TAMPILKAN POP-UP NOTA / INVOICE
      showInvoiceModal(orderData);
    });
  }

  // 4. Fungsi Menampilkan Pop-Up Nota
  function showInvoiceModal(order) {
    if (!invoiceModal || !invoiceContent) return;

    let itemsHTML = "";
    order.items.forEach(item => {
      itemsHTML += `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem;">
          <span>${item.name} (${item.quantity}x)</span>
          <strong>${formatRupiah(item.price * item.quantity)}</strong>
        </div>
      `;
    });

    invoiceContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem;">
        <h3 style="color: var(--text-dark);">Transaksi Berhasil!</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Terima kasih telah berbelanja di <strong>XemaShop</strong>.</p>
      </div>

      <div style="background: var(--bg-color); border: 1px dashed var(--border-color); border-radius: 8px; padding: 0.8rem; font-size: 0.8rem; margin-bottom: 1rem;">
        <div style="margin-bottom: 0.4rem;"><strong>ID Pesanan:</strong> <span style="color: var(--primary-color); font-weight: bold;">${order.orderId}</span></div>
        <div style="margin-bottom: 0.4rem;"><strong>Metode Bayar:</strong> ${order.paymentMethod}</div>
        <div style="margin-bottom: 0.4rem;"><strong>Pengiriman:</strong> ${order.shippingOption}</div>
        <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 0.6rem 0;">
        
        <div style="margin-bottom: 0.4rem;">
          <strong>📦 PENERIMA PAKET:</strong><br>
          ${order.customerName} (${order.customerPhone})<br>
          ${order.address}
        </div>
        <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 0.6rem 0;">
        
        <div>
          <strong>🛒 RINCIAN ITEM:</strong><br>
          ${itemsHTML}
        </div>
        <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 0.6rem 0;">
        
        <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: bold; color: var(--primary-color);">
          <span>Total Akhir:</span>
          <span>${formatRupiah(order.totalAmount)}</span>
        </div>
      </div>
    `;

    // Format pesan WhatsApp
    const sellerPhone = "6285124164662";
    let textWA = `Halo XemaShop! Saya mau konfirmasi pesanan baru:\n\n` +
                 `📌 *ID Pesanan:* ${order.orderId}\n` +
                 `👤 *Nama:* ${order.customerName}\n` +
                 `📱 *No WA:* ${order.customerPhone}\n` +
                 `📍 *Alamat:* ${order.address}\n\n` +
                 `🛒 *Pesanan:*\n`;

    order.items.forEach(i => {
      textWA += `- ${i.name} (${i.quantity}x)\n`;
    });

    textWA += `\n💰 *Total Bayar:* ${formatRupiah(order.totalAmount)}\n` +
              `💳 *Metode:* ${order.paymentMethod}\n\n` +
              `Mohon diproses ya, terima kasih!`;

    if (confirmWaBtn) {
      confirmWaBtn.onclick = () => {
        window.open(`https://wa.me/${sellerPhone}?text=${encodeURIComponent(textWA)}`, '_blank');
      };
    }

    if (backToHomeBtn) {
      backToHomeBtn.onclick = () => {
        window.location.href = "../halaman utama/halaman utama.html";
      };
    }

    invoiceModal.classList.add("active");
  }

  // Jalankan render awal saat halaman checkout terbuka
  renderCheckoutSummary();
});