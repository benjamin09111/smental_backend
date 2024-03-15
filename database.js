const { Pool } = require('pg');

const pool = new Pool({
    host: "",
    user: "",
    password: "",
    database: "",
    port: 5432, // Puerto por defecto de PostgreSQL
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;