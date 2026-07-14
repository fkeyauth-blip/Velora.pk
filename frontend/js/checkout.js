document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (CartModule.getItems().length === 0) {
    AppModule.showToast("Your bag is empty");
    return;
  }
  
  document.getElementById("checkoutBody").innerHTML = `<h3>Checkout</h3>
    <div class="form-group"><label>Name *</label><input type="text" id="coName" required></div>
    <div class="form-group"><label>Phone *</label><input type="tel" id="coPhone" required></div>
    <div class="form-group"><label>Email</label><input type="email" id="coEmail"></div>
    <div class="form-group"><label>Address *</label><input type="text" id="coAddress" required></div>
    <div class="form-group"><label>City *</label><input type="text" id="coCity" required></div>
    <div class="form-group"><label>Payment *</label><select id="coMethod"><option>Cash on Delivery</option><option>EasyPaisa - abdulhaseeb (03015269322)</option><option>JazzCash - abdulhaseeb (03015269322)</option></select></div>
    <button class="btn-primary" style="width:100%;" onclick="submitCheckout()">Place Order</button>`;
  document.getElementById("checkoutOverlay").hidden = false;
});

window.submitCheckout = async () => {
  const form = new FormData();
  form.append("customerName", document.getElementById("coName").value);
  form.append("phone", document.getElementById("coPhone").value);
  form.append("email", document.getElementById("coEmail").value);
  form.append("address", document.getElementById("coAddress").value);
  form.append("city", document.getElementById("coCity").value);
  form.append("paymentMethod", document.getElementById("coMethod").value);
  form.append("items", JSON.stringify(CartModule.getItems()));
  
  try {
    const res = await API.submitOrder(form);
    AppModule.showToast(`Order: ${res.order.id}`);
    CartModule.clear();
    document.getElementById("cartDrawer").hidden = true;
    document.getElementById("checkoutOverlay").hidden = true;
  } catch (err) {
    AppModule.showToast(err.message);
  }
};
