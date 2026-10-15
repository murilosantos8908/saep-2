require("dotenv").config();
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "almoxarifado",
  port: Number(process.env.DB_PORT || 3307),
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
});
pool.on('connection', () => console.info(`[db] Conexão aberta em ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3307}/${process.env.DB_NAME || 'almoxarifado'}`));
pool.on('error', (error) => console.error('[db] Erro no pool:', error));
module.exports = pool;
