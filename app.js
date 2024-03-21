const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const app = express();
const PORT = 3000;
const secretKey = "yasuo";

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

//post, agregar cuenta de psicólogo desde la cuenta ADMIN

app.post('/login', async (req, res) => {
    try {
        //sacar del body la info
        const { correo, contrasena } = req.body;

        //poner la query a la db
        const result = await client.query(`
        SELECT psicologo_id, usuario_id, nombre_usuario, edad, correo, contrasena FROM usuario WHERE correo = '${correo}' AND contrasena = '${contrasena}'
        `);
        const resultado = result.rows;

        //verificar resultado obtenido de la db. La db devuelve un arreglo con los resultados en JSON
        if (resultado.length > 0) {
            //psicologo: type = P_USER8492#$2ASE_392AKSMG
            //usuario: type = US373_USER$%7FEV

            const bloq = resultado[0].bloqueado;

            if(bloq) res.status(401).json({ message: 'usuario bloqueado' });

            var psicologo = resultado[0].psicologo_id;
            var tipo = "US373_USER$%7FEV"; //por defecto usuario

            if (psicologo) {
                tipo = "P_USER8492#$2ASE_392AKSMG";
            }else {
                psicologo = null
            }

            const token = jwt.sign({ correo }, secretKey, { expiresIn: '2d' });
            res.json({
                message: "exito",
                resultado: resultado[0], //es solo 1 resultado efectivo
                token: token,
                tipo: tipo
            });
        } else {
            res.status(401).json({ message: 'error credenciales' });
        }
    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

app.get("/query", async (req, res)=> {
    const result = await client.query(`
        SELECT * FROM usuario
        `);
        const resultado = result.rows;
    
        res.json(resultado);

})

//verificarToken-Autorizado
app.post('/verifyToken', (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(403).json({ isValid: false, message: 'token no proporcionado' });
    }

    // Verificar el token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ isValid: false, message: 'token invalido' });
        }
        res.json({ isValid: true, user: decoded });
    });
});

//INICIATE//
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
