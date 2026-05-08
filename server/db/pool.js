const { Pool } = require("pg");

// Guard: DB_PASSWORD must be explicitly set in the environment.
// An empty string is acceptable (e.g. local dev with no password),
// but a completely missing variable indicates a misconfiguration.
if (process.env.DB_PASSWORD === undefined) {
  console.error(
    "[FATAL] DB_PASSWORD environment variable is not set. " +
      "Add it to your .env file (use an empty string if no password is required)."
  );
  process.exit(1);
}

const pool = new Pool({
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

