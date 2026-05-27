// Guard: DB_PASSWORD must be explicitly set in the environment.
// An empty string is acceptable (e.g. local dev with no password),
// but a completely missing variable indicates a misconfiguration.
const { Pool } = require("pg");

if (!process.env.DATABASE_URL && process.env.DB_PASSWORD === undefined) {
  console.error("[FATAL] Neither DATABASE_URL nor DB_PASSWORD is set.");
  process.exit(1);
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || "kenya_tender_eye",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
    });

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
  process.exit(-1);
});

module.exports = pool;