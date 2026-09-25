import Fastify from "fastify";
import { buildApp } from "./api/app.js";
import { loadConfig } from "./api/config.js";

const config = loadConfig();
const instance = Fastify({
  logger: {
    redact: ["req.headers.authorization"],
  },
});
const app = await buildApp({ config, instance });

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
