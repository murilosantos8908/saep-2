const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "troque-esta-chave";
const TIPOS = ["administrador", "almoxarife", "solicitante"];
const STATUS = ["ativo", "inativo"];
const camposUsuario = "id, nome, email, tipo, status, criado_em";

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

const validarDados = (dados, obrigatorio = true) => {
  const { nome, email, senha, tipo, status } = dados;
  const erros = [];
  if (obrigatorio || nome !== undefined)
    if (typeof nome !== "string" || nome.trim().length < 2)
      erros.push("Nome deve ter pelo menos 2 caracteres");
  if (obrigatorio || email !== undefined)
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim()))
      erros.push("E-mail inválido");
  if (obrigatorio || senha !== undefined)
    if (typeof senha !== "string" || senha.length < 6)
      erros.push("Senha deve ter pelo menos 6 caracteres");
  if (tipo !== undefined && !TIPOS.includes(tipo))
    erros.push("Tipo de usuário inválido");
  if (status !== undefined && !STATUS.includes(status))
    erros.push("Status de usuário inválido");
  return erros;
};

router.use(autenticar);

router.get("/", async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT ${camposUsuario} FROM usuarios WHERE status = 'ativo' ORDER BY nome`
    );
    res.json({ dados: usuarios });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível listar os usuários" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT ${camposUsuario} FROM usuarios WHERE id = ? AND status = 'ativo' LIMIT 1`,
      [req.user.id]
    );
    if (!usuarios[0])
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ dados: usuarios[0] });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível consultar o usuário" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT ${camposUsuario} FROM usuarios WHERE id = ? AND status = 'ativo' LIMIT 1`,
      [req.params.id]
    );
    if (!usuarios[0])
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ dados: usuarios[0] });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível consultar o usuário" });
  }
});

router.post("/", async (req, res) => {
  try {
    const erros = validarDados(req.body);
    if (erros.length) return res.status(400).json({ erro: erros.join("; ") });
    const {
      nome,
      email,
      senha,
      tipo = "solicitante",
      status = "ativo",
    } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);
    const [resultado] = await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo, status) VALUES (?, ?, ?, ?, ?)",
      [nome.trim(), email.trim().toLowerCase(), senhaHash, tipo, status]
    );
    const [usuarios] = await db.query(
      `SELECT ${camposUsuario} FROM usuarios WHERE id = ?`,
      [resultado.insertId]
    );
    res
      .status(201)
      .json({ mensagem: "Usuário criado com sucesso", dados: usuarios[0] });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY")
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    res.status(500).json({ erro: "Não foi possível criar o usuário" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const erros = validarDados(req.body, false);
    if (erros.length) return res.status(400).json({ erro: erros.join("; ") });
    const { nome, email, senha, tipo, status } = req.body;
    const campos = [],
      valores = [];
    if (nome !== undefined) {
      campos.push("nome = ?");
      valores.push(nome.trim());
    }
    if (email !== undefined) {
      campos.push("email = ?");
      valores.push(email.trim().toLowerCase());
    }
    if (senha !== undefined) {
      campos.push("senha = ?");
      valores.push(await bcrypt.hash(senha, 10));
    }
    if (tipo !== undefined) {
      campos.push("tipo = ?");
      valores.push(tipo);
    }
    if (status !== undefined) {
      campos.push("status = ?");
      valores.push(status);
    }
    if (!campos.length)
      return res
        .status(400)
        .json({ erro: "Informe ao menos um campo para alterar" });
    valores.push(req.params.id);
    const [resultado] = await db.query(
      `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );
    if (!resultado.affectedRows)
      return res.status(404).json({ erro: "Usuário não encontrado" });
    const [usuarios] = await db.query(
      `SELECT ${camposUsuario} FROM usuarios WHERE id = ?`,
      [req.params.id]
    );
    res.json({
      mensagem: "Usuário atualizado com sucesso",
      dados: usuarios[0],
    });
  } catch (erro) {
    if (erro.code === "ER_DUP_ENTRY")
      return res.status(409).json({ erro: "E-mail já cadastrado" });
    res.status(500).json({ erro: "Não foi possível atualizar o usuário" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [resultado] = await db.query("DELETE FROM usuarios WHERE id = ?", [
      req.params.id,
    ]);
    if (!resultado.affectedRows)
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ mensagem: "Usuário removido com sucesso" });
  } catch (erro) {
    res.status(500).json({ erro: "Não foi possível remover o usuário" });
  }
});

module.exports = router;
