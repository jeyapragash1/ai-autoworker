import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";
const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`AI AutoWorker backend listening on port ${env.PORT}`);
});
const shutdown = async () => {
    await pool.end();
    server.close(() => {
        process.exit(0);
    });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
