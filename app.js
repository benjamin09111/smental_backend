const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

const app = express();
const PORT = 3000;
const secretKey = "yasuo";

//MIDDLEWARES//
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const nombre_app = "S-MENTAL";
//psicologo: type = P_USER8492#$2ASE_392AKSMG
//usuario: type = US373_USER$%7FEV

//CONEXIÓN//

//falta poner si es que hay un error en la conexión a la db
const connectionString = 'postgres://qzleeezl:m1mRE794ygxu-Krmay3fZl1SeKpHBAqo@otto.db.elephantsql.com/qzleeezl';
const client = new Client({
    connectionString: connectionString,
});
client.connect();

////////////PETICIONES///////////

//post, agregar cuenta de psicólogo desde la cuenta ADMIN

//registro
app.post("/registeruser", async (req, res) => {
    try {
        const { nombre, correo, contrasena, edad, numero_telefono } = req.body;

        const result = await client.query(`
        SELECT usuario_id FROM usuario WHERE correo = '${correo}' OR nombre_usuario = '${nombre}'
        `);
        const user = result.rows;

        if (user.length > 0) {
            res.status(401).json({ message: "correo nombre" });
            return;
        }

        const signup = await client.query(`
        INSERT INTO usuario (nombre_usuario, correo, contrasena, edad, numero_telefono) VALUES ('${nombre}','${correo}','${contrasena}','${edad}','${numero_telefono}')
        `);
        const registrado = signup.rowCount;

        if (registrado > 0) {
            res.status(200).json({ message: "exito" })
        } else {
            res.status(400).json({ message: "fallo" })
        }

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
})

//registro de psicólogo
app.post('/registerpsicologo', async (req, res) => {
    try {
        const { email } = req.body;

        const msg = {
            to: email,
            from: 'correoespecifico.1mental@gmail.com',
            subject: `Verificación para formar parte de ${nombre_app} como psicólogo/a`,
            text: 'Gracias por tu interés en formar parte de nuestra aplicación. Por favor, responde a este correo con tu currículum, certificado de psicología profesional y tu interés por participar en nuestra red, además de cualquier información adicional que estimes conveniente. Estaremos atento a tu respuesta. \n\nSaludos cordiales, equipo de administración.',
        };
        sgMail.send(msg)
            .then(() => res.status(200).json({ message: 'exito' }))
            .catch(error => {
                console.log(error);
                res.status(500).json({ message: 'fallo' })
            });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'fallo' });
    }
});

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

            if (bloq) res.status(401).json({ message: 'usuario bloqueado' });

            var psicologo = resultado[0].psicologo_id;
            var tipo = "US373_USER$%7FEV"; //por defecto usuario

            if (psicologo) {
                tipo = "P_USER8492#$2ASE_392AKSMG";
            } else {
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

app.get("/query", async (req, res) => {
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

//////////////////////////////////////

//get para obtener todas las publicaciones de los usuarios
app.get("/getPublicaciones", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT * FROM usuario WHERE correo = '${correo}' OR nombre_usuario = '${nombre}'
        `);

        const publicaciones = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
})
//get para obtener todos los psicologos

//INICIATE//
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
