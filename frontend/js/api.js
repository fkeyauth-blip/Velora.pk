const CUSTOMER_TOKEN_KEY = "velora_token";

const API = {
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/products${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  },

  async getProduct(id) {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error("Product not found");
    return res.json();
  },

  async submitOrder(formData) {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order failed");
    return data;
  },

  async signup({ name, phone, email, password }) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  },

  async login({ identifier, password }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  }
};
