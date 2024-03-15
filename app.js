const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/*llamada a las queries*/
const { getHelloMessage } = require('./queries');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

////////////PETICIONES////////////////////////////////////

app.get('/', async (req, res) => {
    try {
        const message = await getHelloMessage();
        res.send(`Message from PostgreSQL: ${message}`);
    } catch (err) {
        console.error('Error retrieving hello message', err);
        res.status(500).send('Error retrieving hello message');
    }
});

// Iniciar app
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
