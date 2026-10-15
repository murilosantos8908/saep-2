require("dotenv").config();
const app = require("./app");
const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, "0.0.0.0", () =>
  console.info(`API disponível em http://localhost:${port}`)
);
server.on("error", (error) => {
  console.error("Falha ao iniciar servidor:", error);
  process.exitCode = 1;
});
