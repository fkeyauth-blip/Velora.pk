const ProductsModule = (() => {
  let allProducts = [];
  function money(n) { return `Rs. ${Number(n).toLocaleString("en-PK")}`; }
  
  function cardTemplate(p) {
    const price = p.saleprice || p.price;
    return `<article class="product-card" data-id="${p.id}"><div class="card-media"><img src="${JSON.parse(p.images || "[]")[0] || '/images/placeholder.svg'}" alt="${p.name}"/><button class="quick-view-btn" data-quickview="${p.id}">Quick View</button></div><div class="card-info"><p class="card-name">${p.name}</p><div class="card-price">${money(price)}</div></div></article>`;
  }
  
  function render() {
    let filtered = allProducts;
    const maxPrice = parseInt(document.getElementById("priceSlider").value);
    filtered = filtered.filter(p => (p.saleprice || p.price) <= maxPrice);
    document.getElementById("resultsCount").textContent = `${filtered.length} products`;
    document.getElementById("productGrid").innerHTML = filtered.map(cardTemplate).join("");
  }
  
  document.getElementById("productGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quickview]");
    if (!btn) return;
    const product = allProducts.find(p => p.id === btn.dataset.quickview);
    if (!product) return;
    
    let sizes = JSON.parse(product.sizes || "[]");
    let colors = JSON.parse(product.colors || "[]");
    const price = product.saleprice || product.price;
    const images = JSON.parse(product.images || "[]");
    const showSizes = product.showsizeguide && sizes.length > 0;
    
    document.getElementById("modalBody").innerHTML = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;"><div><img src="${images[0]}" style="width:100%; border-radius:8px;"></div><div><h3>${product.name}</h3><p style="color:#0F766E; font-weight:600;">Category: ${product.category}</p><div style="font-size:18px; font-weight:600; margin:10px 0;">${money(price)}</div><p>${product.description}</p>${showSizes ? `<label style="display:block; margin-top:12px; font-weight:600; font-size:13px;">Size: <a href="#" onclick="event.preventDefault(); document.getElementById('sizeGuideOverlay').hidden=false;" style="color:#0F766E;">View Size Guide</a></label><div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0;">${sizes.map(s => `<button style="padding:8px 12px; border:1px solid #E5E7EB; border-radius:4px; cursor:pointer;">${s}</button>`).join("")}</div>` : ""}${colors.length > 0 ? `<label style="display:block; margin-top:12px; font-weight:600; font-size:13px;">Color</label><div style="display:flex; gap:8px;">${colors.map(c => `<button style="padding:8px 12px; border:1px solid #E5E7EB; border-radius:4px;">${c}</button>`).join("")}</div>` : ""}<div style="display:flex; gap:8px; margin-top:20px;"><button class="btn-primary" style="flex:1;" onclick="CartModule.addItem({productId:'${product.id}', name:'${product.name}', price:${price}, qty:1}); document.getElementById('productModalOverlay').hidden=true;">Add</button><a href="https://wa.me/923015269322?text=${product.name}" target="_blank" class="btn-gold" style="flex:1; text-align:center; text-decoration:none;">WhatsApp</a></div></div></div>`;
    document.getElementById("productModalOverlay").hidden = false;
  });
  
  return {
    async init() {
      try {
        const data = await API.getProducts();
        allProducts = data.products;
        render();
      } catch (err) {
        console.error(err);
      }
    },
    render,
    money
  };
})();
