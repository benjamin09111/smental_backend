const pool = require('./db');

const getHelloMessage = async () => {
    try {
        const result = await pool.query('SELECT $1::text as message', ['Hello world!']);
        return result.rows[0].message;
    } catch (err) {
        console.error('Error executing query', err);
        throw err;
    }
};

module.exports = {
    getHelloMessage,
};
