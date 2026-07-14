const CartModule = (() => {
  let items = JSON.parse(localStorage.getItem("velora_cart") || "[]");
  
  function save() {
    localStorage.setItem("velora_cart", JSON.stringify(items));
    updateUI();
  }
  
  function updateUI() {
    document.getElementById("cartCount").textContent = items.length;
    const html = items.map((item, i) => `<div style="padding:12px; border-bottom:1px solid #E5E7EB;"><strong>${item.name}</strong> × ${item.qty} = Rs. ${(item.price * item.qty).toLocaleString()}<button onclick="CartModule.remove(${i})" style="float:right; background:none; border:none; color:#B91C1C; cursor:pointer;">Remove</button></div>`).join("");
    document.getElementById("cartItems").innerHTML = html || "<p>Empty</p>";
    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById("cartTotal").textContent = `Rs. ${total.toLocaleString()}`;
  }
  
  return {
    init() { updateUI(); },
    addItem(item) { items.push(item); save(); AppModule.showToast("Added to cart!"); },
    remove(i) { items.splice(i, 1); save(); },
    getItems() { return items; },
    clear() { items = []; save(); }
  };
})();
