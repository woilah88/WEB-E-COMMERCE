document.addEventListener("DOMContentLoaded", () => {
    // Ambil pesanan terakhir dari ORDER_HISTORY_XEMA
    const orderHistory = JSON.parse(localStorage.getItem("ORDER_HISTORY_XEMA")) || [];
    
    if (orderHistory.length === 0) {
        document.getElementById("receipt-content").innerHTML = "<p style='text-align:center;'>Data pesanan tidak ditemukan.</p>";
        return;
    }

    const latestOrder = orderHistory[orderHistory.length - 1]; // Pesanan paling baru
    const container = document.getElementById("receipt-content");

    let itemsHTML = "";
    latestOrder.items.forEach(item => {
        itemsHTML += `
            <div class="order-row">
                <span>${item.name} (${item.quantity}x)</span>
                <strong>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</strong>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="order-row">
            <span>ID Pesanan:</span>
            <strong>${latestOrder.orderId}</strong>
        </div>
        <div class="order-row">
            <span>Tanggal:</span>
            <span>${latestOrder.date}</span>
        </div>
        <div class="order-row">
            <span>Nama Pembeli:</span>
            <span>${latestOrder.customerName || '-'}</span>
        </div>
        <div class="order-row">
            <span>No. WhatsApp:</span>
            <span>${latestOrder.customerPhone || '-'}</span>
        </div>
        <div class="order-row">
            <span>Alamat:</span>
            <span style="max-width: 60%; text-align: right;">${latestOrder.address || '-'}</span>
        </div>
        
        <div class="order-item-list">
            <strong style="display:block; margin-bottom: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">DAFTAR BARANG:</strong>
            ${itemsHTML}
        </div>

        <div class="order-row">
            <span>Metode Pembayaran:</span>
            <span>${latestOrder.paymentMethod || 'Transfer Bank'}</span>
        </div>
        <div class="order-row" style="font-size: 1.1rem; font-weight: bold; color: var(--primary-color); margin-top: 0.5rem;">
            <span>Total Bayar:</span>
            <span>Rp ${Number(latestOrder.totalAmount || 0).toLocaleString('id-ID')}</span>
        </div>
    `;

    // Format pesan otomatis ke WhatsApp Penjual
    const sellerPhone = "6285124164662"; 
    let textWA = `Halo XemaShop! Saya ingin mengonfirmasi pesanan saya:\n\n` +
                 `📌 *ID Pesanan:* ${latestOrder.orderId}\n` +
                 `👤 *Nama:* ${latestOrder.customerName}\n` +
                 `📱 *No HP:* ${latestOrder.customerPhone}\n` +
                 `📍 *Alamat:* ${latestOrder.address}\n\n` +
                 `🛒 *Pesanan:*\n`;

    latestOrder.items.forEach(item => {
        textWA += `- ${item.name} (${item.quantity}x)\n`;
    });

    textWA += `\n💰 *Total:* Rp ${Number(latestOrder.totalAmount || 0).toLocaleString('id-ID')}\n` +
              `💳 *Metode:* ${latestOrder.paymentMethod}\n\n` +
              `Mohon segera diproses ya, terima kasih!`;

    const waBtn = document.getElementById("wa-share-btn");
    if (waBtn) {
        waBtn.href = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(textWA)}`;
    }
});