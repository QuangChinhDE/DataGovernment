export default {

  defaultTab: 'Sign In',

  setDefaultTab(newTab) {
    this.defaultTab = newTab;
  },

  async signIn() {
    try {
      const emailInput = (inp_email.text || "").trim().toLowerCase();
      const passwordInput = (inp_password.text || "").toString().trim();

      const raw = await findUserByEmail.run();   // trả về [] hoặc { data: [] }
      const users = Array.isArray(raw) ? raw : (raw?.data || []);
      const user = users.find(u =>
        (u.email || "").toString().trim().toLowerCase() === emailInput
      );

      if (user && (user.password_hash || "").toString().trim() === passwordInput) {
        await storeValue("currentUser", {
          id: user.id,
          email: user.email,
          username: user.username,          // đã lưu dạng full name
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        });
        showAlert("Login success", "success");
        navigateTo("Overview");
      } else {
        showAlert("Invalid email/password", "error");
      }
    } catch (e) {
      showAlert("Login error", "error");
      console.log("signIn error:", e);
    }
  },
  
  async register() {
    try {
      // 0) Validate cơ bản
      const firstName = (inp_firstName.text || "").trim();
      const lastName  = (inp_lastName.text || "").trim();
      const emailRaw  = (inp_registerEmail.text || "");
      const passRaw   = (inp_registerPassword.text || "");

      const email = emailRaw.trim().toLowerCase();
      const password = passRaw.toString().trim();

      if (!firstName || !lastName || !email || !password) {
        showAlert("Please fill in all fields", "warning");
        return;
      }

      // 1) Check trùng email bằng fetchUsers
      const all = await fetchUsers.run();
      const rows = Array.isArray(all) ? all : (all?.data || []);

      const exists = rows.some(
        u => (u.email || "").toString().trim().toLowerCase() === email
      );
      if (exists) {
        showAlert("❌ Email already exists", "error");
        return;
      }

      // 2) Payload để chèn
      const payload = {
        id: String(Math.floor(Date.now() / 1000)),
        first_name: firstName,
        last_name: lastName,
        email,
        username: `${firstName} ${lastName}`.trim(),  // ✅ dùng full name làm username
        password_hash: password,
        role: "user",
        created: moment().toISOString(),
        updated: moment().toISOString()
      };

      // 3) Insert vào sheet
      await createUser.run(payload);

      // 4) Lưu state & chuyển trang
      await storeValue("currentUser", {
        id: payload.id,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        first_name: payload.first_name,
        last_name: payload.last_name
      });

      showAlert("Register success", "success");
      navigateTo("Overview");
    } catch (e) {
      showAlert(String(e?.message || "Error creating new user"), "error");
      console.log("register error:", e);
    }
  },

  async signOut() {
    await removeValue("currentUser");
    showAlert("Signed out", "info");
    navigateTo("Login");
  }

};
