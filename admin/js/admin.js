const ADMIN_KEY = "maison-admin-2026";
function showPanel(name) {
  document.querySelectorAll(".admin-panel").forEach(p => p.hidden = true);
  document.getElementById(name + "-panel").hidden = false;
  if (name === "stats") loadStats();
  if (name === "products") loadProducts();
}
async function loadStats() {
  try {
    const res = await fetch("/api/admin/stats", { headers: { "x-admin-key": ADMIN_KEY } });
    const data = await res.json();
    document.getElementById("statsContent").innerHTML = `<div class="stat-card"><strong>Total Orders:</strong> ${data.totalOrders}</div><div class="stat-card"><strong>Revenue:</strong> Rs. ${(data.totalRevenue || 0).toLocaleString()}</div><div class="stat-card"><strong>Products:</strong> ${data.totalProducts}</div><div class="stat-card"><strong>Low Stock:</strong> ${data.lowStock} items</div>`;
  } catch (err) {
    document.getElementById("statsContent").innerHTML = `<p style="color:#B91C1C;">${err.message}</p>`;
  }
}
async function loadProducts() {
  try {
    const res = await fetch("/api/admin/products", { headers: { "x-admin-key": ADMIN_KEY } });
    const data = await res.json();
    const html = data.products.map(p => {
      const sizes = JSON.parse(p.sizes || "[]");
      return `<tr><td>${p.name}</td><td>Rs. ${p.price}</td><td>${p.stock}</td><td>${sizes.length > 0 ? sizes.join(", ") : "No sizes"}</td><td>${p.showsizeguide && sizes.length > 0 ? "✓ Yes" : "✗ No"}</td><td><button class="btn btn-danger" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`;
    }).join("");
    document.getElementById("productsList").innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}
async function deleteProduct(id) {
  if (!confirm("Delete?")) return;
  try {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: { "x-admin-key": ADMIN_KEY } });
    alert("Deleted!");
    loadProducts();
  } catch (err) {
    alert("Error: " + err.message);
  }
}
loadStats();
