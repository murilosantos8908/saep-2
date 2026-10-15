const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave";
const TIPOS_GERENTE = ["administrador", "almoxarife"];
const camposGerente = "id, nome, email, tipo, status, criado_em";

const autenticar = async (req, res, next) => {
  try {
    const cabecalho = req.headers.authorization || "";
    if (!cabecalho.startsWith("Bearer "))
      return res.status(401).json({ erro: "Token inválido ou ausente" });
    const payload = jwt.verify(cabecalho.substring(7).trim(), JWT_SECRET);
    const [usuarios] = await db.query(
      "SELECT id, nome, email, tipo, status FROM usuarios WHERE id = ? LIMIT 1",
      [payload.id]
    );
    if (!usuarios[0] || usuarios[0].status !== "ativo")
      return res
        .status(401)
        .json({ erro: "Usuário não encontrado ou inativo" });
    req.user = usuarios[0];
    next();
  } catch (erro) {
    res.status(401).json({ erro: "Token inválido ou ausente" });
  }
};

const somenteAdministrador = (req, res, next) => {
  if (req.user.tipo !== "administrador")
    return res
      .status(403)
      .json({ erro: "Somente administradores podem realizar esta operação" });
  next();
};

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const [gerentes] = await db.query(
      `SELECT ${camposGerente} FROM usuarios WHERE tipo IN ('administrador', 'almoxarife') AND status = 'ativo' ORDER BY nome`
    );
    res.json({ dados: gerentes });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível listar os gerentes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [gerentes] = await db.query(
      `SELECT ${camposGerente} FROM usuarios WHERE id = ? AND tipo IN ('administrador', 'almoxarife') AND status = 'ativo' LIMIT 1`,
      [req.params.id]
    );
    if (!gerentes[0])
      return res.status(404).json({ erro: "Gerente não encontrado" });
    res.json({ dados: gerentes[0] });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível consultar o gerente" });
  }
});

router.post("/", somenteAdministrador, async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      tipo = "almoxarife",
      status = "ativo",
    } = req.body;
    if (typeof nome !== "string" || nome.trim().length < 2)
      return res
        .status(400)
        .json({ erro: "Nome deve ter pelo menos 2 caracteres" });
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()))
      return res.status(400).json({ erro: "E-mail inválido" });
    if (typeof senha !== "string" || senha.length < 6)
      return res
        .status(400)
        .json({ erro: "Senha deve ter pelo menos 6 caracteres" });
    if (!TIPOS_GERENTE.includes(tipo))
      return res.status(400).json({ erro: "Tipo de gerente inválido" });
    if (!["ativo", "inativo"].includes(status))
      return res.status(400).json({ erro: "Status de usuário inválido" });
    const senhaHash = await bcrypt.hash(senha, 10);
    const [resultado] = await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo, status) VALUES (?, ?, ?, ?, ?)",
      [nome.trim(), email.trim().toLowerCase(), senhaHash, tipo, status]
    );
    const [gerentes] = await db.query(
      `SELECT ${camposGerente} FROM usuarios WHERE id = ?`,
      [resultado.insertId]
    );
    res
      .status(201)
      .json({ mensagem: "Gerente criado com sucesso", dados: gerentes[0] });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY")
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    res.status(500).json({ erro: "Não foi possível criar o gerente" });
  }
});

router.put("/:id", somenteAdministrador, async (req, res) => {
  try {
    const { nome, email, senha, tipo, status } = req.body;
    const campos = [],
      valores = [];
    if (nome !== undefined) {
      if (typeof nome !== "string" || nome.trim().length < 2)
        return res
          .status(400)
          .json({ erro: "Nome deve ter pelo menos 2 caracteres" });
      campos.push("nome = ?");
      valores.push(nome.trim());
    }
    if (email !== undefined) {
      if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()))
        return res.status(400).json({ erro: "E-mail inválido" });
      campos.push("email = ?");
      valores.push(email.trim().toLowerCase());
    }
    if (senha !== undefined) {
      if (typeof senha !== "string" || senha.length < 6)
        return res
          .status(400)
          .json({ erro: "Senha deve ter pelo menos 6 caracteres" });
      campos.push("senha = ?");
      valores.push(await bcrypt.hash(senha, 10));
    }
    if (tipo !== undefined) {
      if (!TIPOS_GERENTE.includes(tipo))
        return res.status(400).json({ erro: "Tipo de gerente inválido" });
      campos.push("tipo = ?");
      valores.push(tipo);
    }
    if (status !== undefined) {
      if (!["ativo", "inativo"].includes(status))
        return res.status(400).json({ erro: "Status de usuário inválido" });
      campos.push("status = ?");
      valores.push(status);
    }
    if (!campos.length)
      return res
        .status(400)
        .json({ erro: "Informe ao menos um campo para alterar" });
    valores.push(req.params.id);
    const [resultado] = await db.query(
      `UPDATE usuarios SET ${campos.join(
        ", "
      )} WHERE id = ? AND tipo IN ('administrador', 'almoxarife')`,
      valores
    );
    if (!resultado.affectedRows)
      return res.status(404).json({ erro: "Gerente não encontrado" });
    const [gerentes] = await db.query(
      `SELECT ${camposGerente} FROM usuarios WHERE id = ?`,
      [req.params.id]
    );
    res.json({
      mensagem: "Gerente atualizado com sucesso",
      dados: gerentes[0],
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY")
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    res.status(500).json({ erro: "Não foi possível atualizar o gerente" });
  }
});

router.delete("/:id", somenteAdministrador, async (req, res) => {
  try {
    const [resultado] = await db.query(
      "DELETE FROM usuarios WHERE id = ? AND tipo IN ('administrador', 'almoxarife')",
      [req.params.id]
    );
    if (!resultado.affectedRows)
      return res.status(404).json({ erro: "Gerente não encontrado" });
    res.json({ mensagem: "Gerente removido com sucesso" });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível remover o gerente" });
  }
});

module.exports = router;
