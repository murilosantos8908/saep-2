require("dotenv").config();
const mysql = require("mysql2/promise");

let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "almoxarifado",
    port: Number(process.env.DB_PORT || 3307),
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
  });

  pool.on("connection", () =>
    console.info(
      `[db] Conexão aberta em ${process.env.DB_HOST || "localhost"}:${
        process.env.DB_PORT || 3307
      }/${process.env.DB_NAME || "almoxarifado"}`
    )
  );

  pool.on("error", (error) => console.error("[db] Erro no pool:", error));
} catch (error) {
  console.error("[db] Falha ao criar pool de conexões:", error);
}

module.exports = pool;