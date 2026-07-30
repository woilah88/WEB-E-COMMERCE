document.addEventListener("DOMContentLoaded", () => {
  // SAMAKAN NAMA KUNCI LOCALSTORAGE DENGAN APP.JS
  let cart = JSON.parse(localStorage.getItem("CART_XEMASHOP")) || [];
  
  const checkoutItemsContainer = document.getElementById("checkout-items-container");
  const subtotalElement = document.getElementById("checkout-subtotal");
  const shippingCostElement = document.getElementById("checkout-shipping-cost");
  const totalPaymentElement = document.getElementById("checkout-total-payment");
  const shippingSelect = document.getElementById("shipping-select");
  const checkoutForm = document.getElementById("checkout-form");
  
  const invoiceModal = document.getElementById("invoice-modal");
  const invoiceContent = document.getElementById("invoice-content");
  const confirmWaBtn = document.getElementById("confirm-wa-btn");
  const backToHomeBtn = document.getElementById("back-to-home-btn");

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  function renderCheckoutSummary() {
    if (!checkoutItemsContainer) return;
    checkoutItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      checkoutItemsContainer.innerHTML = `
        <p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">
          Keranjang kamu masih kosong.<br>
          <a href="../halaman utama/halaman utama.html" style="color: var(--primary-color); font-weight: bold; margin-top: 0.5rem; display: inline-block;">
            Kembali Belanja
          </a>
        </p>
      `;
      if (subtotalElement) subtotalElement.textContent = "Rp 0";
      if (shippingCostElement) shippingCostElement.textContent = "Rp 0";
      if (totalPaymentElement) totalPaymentElement.textContent = "Rp 0";
      return;
    }

    let subtotal = 0;

    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      let imageSrc = item.image || "";
      if (imageSrc && !imageSrc.startsWith("http") && !imageSrc.startsWith("../")) {
        imageSrc = "../" + imageSrc;
      }

      const itemDiv = document.createElement("div");
      itemDiv.style.cssText = "display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.8rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border-color);";
      
      itemDiv.innerHTML = `
        <img src="${imageSrc}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); flex-shrink: 0;">
        <div style="flex-grow: 1;">
          <h4 style="font-size: 0.85rem; margin-bottom: 0.2rem; color: var(--text-dark);">${item.name}</h4>
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

  if (shippingSelect) {
    shippingSelect.addEventListener("change", renderCheckoutSummary);
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (cart.length === 0) {
        alert("Keranjang kamu kosong!");
        return;
      }

      const name = document.getElementById("input-name").value.trim();
      const phone = document.getElementById("input-phone").value.trim();
      const address = document.getElementById("input-address").value.trim();
      const shippingOption = shippingSelect.options[shippingSelect.selectedIndex].text;
      const shippingCost = Number(shippingSelect.value);
      const paymentMethod = document.getElementById("payment-select").value;

      let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let totalAmount = subtotal + shippingCost;

      const orderId = "XEMA-" + Math.floor(100000 + Math.random() * 900000);
      const todayDate = new Date().toLocaleDateString("id-ID", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

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

      let history = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
      history.unshift(orderData);
      localStorage.setItem("ORDER_HISTORY_XEMA", JSON.stringify(history));
      localStorage.removeItem("CART_XEMASHOP"); // DIBERSIHKAN PAS TRANSAKSI SELESAI

      showInvoiceModal(orderData);
    });
  }

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

  renderCheckoutSummary();
});