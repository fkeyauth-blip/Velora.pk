const AuthModule = (() => {
  let currentUser = null;
  const TOKEN_KEY = "velora_token";
  
  function updateUI() {
    document.getElementById("accountLabel").textContent = currentUser ? currentUser.name.split(" ")[0] : "Sign In";
  }
  
  document.getElementById("accountToggle").addEventListener("click", () => {
    if (currentUser) {
      if (confirm("Sign out?")) {
        localStorage.removeItem(TOKEN_KEY);
        currentUser = null;
        updateUI();
      }
    } else {
      document.getElementById("authBody").innerHTML = `<h3>Sign In</h3><input type="text" id="authId" placeholder="Phone or Email" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><input type="password" id="authPass" placeholder="Password" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><button id="authBtn" class="btn-primary" style="width:100%;">Sign In</button><p style="font-size:12px; color:#6B7280; margin-top:12px;">No account? <a href="#" onclick="event.preventDefault(); showSignupForm()" style="color:#0F766E;">Create one</a></p>`;
      document.getElementById("authOverlay").hidden = false;
      document.getElementById("authBtn").addEventListener("click", async () => {
        try {
          const data = await API.login({ identifier: document.getElementById("authId").value, password: document.getElementById("authPass").value });
          localStorage.setItem(TOKEN_KEY, data.token);
          currentUser = data.user;
          updateUI();
          document.getElementById("authOverlay").hidden = true;
          AppModule.showToast("Signed in!");
        } catch (err) {
          AppModule.showToast(err.message);
        }
      });
    }
  });
  
  window.showSignupForm = () => {
    document.getElementById("authBody").innerHTML = `<h3>Create Account</h3><input type="text" id="suName" placeholder="Full Name" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><input type="tel" id="suPhone" placeholder="Phone" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><input type="email" id="suEmail" placeholder="Email" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><input type="password" id="suPass" placeholder="Password" style="display:block; width:100%; padding:10px; margin:10px 0; border:1px solid #E5E7EB;"><button id="suBtn" class="btn-primary" style="width:100%;">Create</button>`;
    document.getElementById("suBtn").addEventListener("click", async () => {
      try {
        const data = await API.signup({ name: document.getElementById("suName").value, phone: document.getElementById("suPhone").value, email: document.getElementById("suEmail").value, password: document.getElementById("suPass").value });
        localStorage.setItem(TOKEN_KEY, data.token);
        currentUser = data.user;
        updateUI();
        document.getElementById("authOverlay").hidden = true;
        AppModule.showToast("Account created!");
      } catch (err) {
        AppModule.showToast(err.message);
      }
    });
  };
  
  return { init: () => updateUI() };
})();
