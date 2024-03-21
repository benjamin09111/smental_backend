const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const app = express();
const PORT = 3000;

//MIDDLEWARES//
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//CONEXIÓN//

//falta poner si es que hay un error en la conexión a la db
const connectionString = 'postgres://ujhvhevl:P6I_Q-1wZ23PAlsQojsLk2Y-r04__GpN@otto.db.elephantsql.com/ujhvhevl';
const client = new Client({
    connectionString: connectionString,
});
client.connect();

////////////PETICIONES///////////

app.get('/login/user', async (req, res) => {
    try {
        //sacar del body la info
        const { correo, contrasena } = req.body;

        //poner la query a la db
        const result = await client.query(`
        SELECT usuario_id, nombre_usuario, edad, correo, contrasena FROM usuario WHERE correo = '${correo}' AND contrasena = '${contrasena}'
        `);
        const resultado = result.rows;

        //verificar resultado obtenido de la db. La db devuelve un arreglo con los resultados en JSON
        if(resultado.length > 0) {
            //pasar token
            res.json({
                resultado: resultado[0], //es solo 1 resultado efectivo
                token: "",
            });
        }else {
            res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ error: 'Error en la consulta GET' });
    }
});

//INICIATE//
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
