const form = document.querySelector("#loginForm");
document.querySelector("#togglePassword")?.addEventListener("click", (e) => {
  const i = document.querySelector("#password");
  i.type = i.type === "password" ? "text" : "password";
  e.target.textContent = i.type === "password" ? "Mostrar" : "Ocultar";
});
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.querySelector("#loginMessage");
  const email = document.querySelector("#email").value;
  const senha = document.querySelector("#password").value;
  if (email === "admin@almoxarifado.com" && senha === "123456") {
    localStorage.setItem(
      "almoxarifado_user",
      JSON.stringify({ nome: "Ana Oliveira", tipo: "Administrador" }),
    );
    window.location.href = "dashboard.html";
    return;
  }
  try {
    const r = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.erro);
    localStorage.setItem("almoxarifado_token", d.token);
    localStorage.setItem("almoxarifado_user", JSON.stringify(d.usuario));
    window.location.href = "dashboard.html";
  } catch (err) {
    msg.textContent =
      "Não foi possível entrar. Verifique seus dados ou use o acesso demo.";
  }
});
