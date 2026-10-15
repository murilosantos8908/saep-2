const API = "http://localhost:3000";
const token = localStorage.getItem("almoxarifado_token");
const user = JSON.parse(localStorage.getItem("almoxarifado_user") || "{}");
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
async function api(path, options = {}) {
  const r = await fetch(`${API}/api/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const d = r.status === 204 ? null : await r.json();
  if (!r.ok) throw Error(d.erro || "Falha na API");
  return d;
}
const page = document.body.dataset.page;
const menuToggle = $("#menuToggle");
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  $("#primaryNav")?.classList.toggle("is-open", !open);
});
document.querySelectorAll("#primaryNav a").forEach((a) =>
  a.addEventListener("click", () => {
    $("#primaryNav")?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  })
);
if (!token) location.href = "login.html";
if ($("#userName")) $("#userName").textContent = user.nome || "Usuário";
if ($("#userRole")) $("#userRole").textContent = user.tipo || "";
$("#logout")?.addEventListener("click", () => localStorage.clear());
async function load() {
  try {
    if (["estoque", "produtos"].includes(page)) {
      const ps = await api("produtos");
      if (page === "produtos") {
        const [cs, fs] = await Promise.all([
          api("categorias"),
          api("fornecedores"),
        ]);
        $("#categoria").innerHTML =
          '<option value="">Sem categoria</option>' +
          cs
            .map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`)
            .join("");
        $("#fornecedor").innerHTML =
          '<option value="">Sem fornecedor</option>' +
          fs
            .map((f) => `<option value="${f.id}">${esc(f.nome)}</option>`)
            .join("");
      }
      const low = ps.filter((p) => +p.quantidade_estoque <= +p.estoque_minimo);
      if ($("#stats"))
        $("#stats").innerHTML = `<article><span>PRODUTOS</span><b>${
          ps.length
        }</b></article><article><span>ITENS EM ESTOQUE</span><b>${ps.reduce(
          (n, p) => n + +p.quantidade_estoque,
          0
        )}</b></article><article><span>ESTOQUE BAIXO</span><b>${
          low.length
        }</b></article>`;
      $("#rows").innerHTML =
        ps
          .map(
            (p) =>
              `<tr><td>${esc(p.nome)}</td><td>${esc(
                p.categoria || "—"
              )}</td><td>${esc(p.fornecedor || "—")}</td><td>${esc(
                p.quantidade_estoque
              )} ${esc(p.unidade_medida)}</td><td>${esc(
                p.estoque_minimo
              )}</td><td>${
                +p.quantidade_estoque <= +p.estoque_minimo ? "Baixo" : "OK"
              } ${
                page === "produtos"
                  ? `<button data-edit="${p.id}" type="button">Editar</button> <button data-delete="${p.id}" type="button">Excluir</button>`
                  : ""
              }</td></tr>`
          )
          .join("") ||
        '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
    }
    if (page === "movimentacoes") {
      const [ms, ps] = await Promise.all([
        api("movimentacoes"),
        api("produtos"),
      ]);
      $("#produto").innerHTML = ps
        .map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`)
        .join("");
      $("#rows").innerHTML =
        ms
          .map(
            (m) =>
              `<tr><td>${esc(m.produto)}</td><td>${esc(
                m.tipo_movimentacao
              )}</td><td>${esc(m.quantidade)}</td><td>${esc(
                m.usuario
              )}</td><td>${new Date(m.data).toLocaleString(
                "pt-BR"
              )}</td><td>${esc(m.observacao || "")}</td></tr>`
          )
          .join("") || '<tr><td colspan="6">Sem movimentações.</td></tr>';
    }
    if (page === "solicitacoes") {
      const [ss, ps] = await Promise.all([
        api("solicitacoes"),
        api("produtos"),
      ]);
      $("#produto").innerHTML = ps
        .map(
          (p) =>
            `<option value="${p.id}">${esc(p.nome)} (saldo ${esc(
              p.quantidade_estoque
            )})</option>`
        )
        .join("");
      $("#rows").innerHTML =
        ss
          .map(
            (s) =>
              `<tr><td>${esc(s.produto)}</td><td>${esc(
                s.quantidade
              )}</td><td>${esc(s.usuario)}</td><td>${esc(
                s.status
              )}</td><td>${new Date(s.data).toLocaleString("pt-BR")}</td></tr>`
          )
          .join("") || '<tr><td colspan="5">Nenhuma solicitação.</td></tr>';
    }
    if (page === "fornecedores") {
      const fs = await api("fornecedores");
      $("#rows").innerHTML =
        fs
          .map(
            (f) =>
              `<tr><td>${esc(f.nome)}</td><td>${esc(
                f.contato || "—"
              )}</td><td>${esc(f.telefone || "—")}</td><td>${esc(
                f.email || "—"
              )}</td></tr>`
          )
          .join("") || '<tr><td colspan="4">Nenhum fornecedor.</td></tr>';
    }
    if (page === "relatorios") {
      const [ps, ms] = await Promise.all([
        api("produtos"),
        api("movimentacoes"),
      ]);
      $("#stats").innerHTML = `<article><span>PRODUTOS CADASTRADOS</span><b>${
        ps.length
      }</b></article><article><span>ITENS EM ESTOQUE</span><b>${ps.reduce(
        (n, p) => n + +p.quantidade_estoque,
        0
      )}</b></article><article><span>MOVIMENTAÇÕES RECENTES</span><b>${
        ms.length
      }</b></article><article><span>ESTOQUE BAIXO</span><b>${
        ps.filter((p) => +p.quantidade_estoque <= +p.estoque_minimo).length
      }</b></article>`;
      $("#rows").innerHTML = ps
        .map(
          (p) =>
            `<tr><td>${esc(p.nome)}</td><td>${esc(
              p.quantidade_estoque
            )}</td><td>${esc(p.estoque_minimo)}</td></tr>`
        )
        .join("");
    }
  } catch (e) {
    if ($("#message")) $("#message").textContent = e.message;
  }
}
$("#actionForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  try {
    await api(page === "movimentacoes" ? "movimentacoes" : "solicitacoes", {
      method: "POST",
      body: JSON.stringify({
        ...d,
        produto_id: +d.produto_id,
        quantidade: +d.quantidade,
      }),
    });
    e.currentTarget.reset();
    $("#message").textContent = "Registro salvo.";
    load();
  } catch (err) {
    $("#message").textContent = err.message;
  }
});
$("#productForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  try {
    await api("produtos", {
      method: "POST",
      body: JSON.stringify({
        ...d,
        categoria_id: +d.categoria_id || null,
        fornecedor_id: +d.fornecedor_id || null,
        quantidade_estoque: +d.quantidade_estoque,
        estoque_minimo: +d.estoque_minimo,
      }),
    });
    e.currentTarget.reset();
    $("#message").textContent = "Produto criado.";
    load();
  } catch (err) {
    $("#message").textContent = err.message;
  }
});
$("#rows")?.addEventListener("click", async (e) => {
  const id = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  if (deleteId) {
    if (!confirm("Excluir este produto? A ação não pode ser desfeita.")) return;
    try {
      await api(`produtos/${deleteId}`, { method: "DELETE" });
      load();
    } catch (err) {
      $("#message").textContent = err.message;
    }
    return;
  }
  if (!id) return;
  const stock = prompt("Nova quantidade em estoque:");
  if (stock === null || !Number.isFinite(+stock) || +stock < 0) return;
  try {
    await api(`produtos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ quantidade_estoque: +stock }),
    });
    load();
  } catch (err) {
    $("#message").textContent = err.message;
  }
});
load();
