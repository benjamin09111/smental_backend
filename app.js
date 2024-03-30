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
        SELECT * FROM publicacion`);

        const publicaciones = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});
//get para obtener todas las publicaciones basadas en un hashtag

app.get("/getPublicacionesHashtag", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT p.fecha_publicacion, p.titulo, p.descripcion FROM publicacion p, usuario u, usuario_hashtag uh, hashtag h
        WHERE u.usuario_id = uh.usuario_id 
        AND uh.hashtag_id = h.hashtag_id 
        AND h.hashtag_id = p.hashtag_id 
        AND h.nombre ='${h.nombre}' GROUP BY p.fecha_publicacion, p.titulo, p.descripcion
`);

        const publicaciones_hashtag = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones_hashtag)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para obtener publicaciones basadas en el nivel de relevancia
app.get("/getPublicacionesRelevancia", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario, p.fecha_publicacion, p.titulo, p.descripcion, p.nivel_relevancia FROM publicacion p, usuario u 
        WHERE p.autor_id = u.usuario_id ORDER BY p.nivel_relevancia DESC
`);

        const publicaciones_relevancia = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones_relevancia)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para obtener todas las publicaciones de usuarios basadas en la fecha más reciente
app.get("/getPublicacionesFecha", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario, p.fecha_publicacion, p.titulo, p.descripcion FROM publicacion p, usuario u WHERE p.autor_id = u.usuario_id ORDER BY p.fecha_publicacion DESC
`);

        const publicaciones_fecha = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones_fecha)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para obtener todos los comentarios
app.get("/getComentarios", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario, p.publicacion_id, c.descripcion FROM comentario c, publicacion p, usuario u 
        WHERE c.publicacion_id = p.publicacion_id AND c.usuario_id = u.usuario_id
`);

        const comentarios = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(comentarios)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer todos los reportes de publicacion 
app.get("/getReportePublicacion", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario AS reportador, pr.titulo, pr.descripcion FROM p_reporte pr, usuario u , publicacion p 
        WHERE pr.publicacion_id = p.publicacion_id AND pr.reportador_id = u.usuario_id
`);

        const publicaciones_reportes = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(publicaciones_reportes)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer todos los reportes de comentario 
app.get("/getReporteComentario", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario AS reportador, cr.titulo, cr.descripcion FROM c_reporte cr, usuario u , publicacion p 
        WHERE cr.c_reporte_id = p.publicacion_id AND cr.reportador_id = u.usuario_id
`);

        const comentarios_reportes = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(comentarios_reportes)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer todos los reportes de post 
app.get("/getReportePost", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario AS reportador, po.titulo, po.descripcion FROM post_reporte po, usuario u , post p 
        WHERE po.post_id = p.post_id AND po.reportador_id = u.usuario_id
`);

        const post_reportes = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(post_reportes)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer conteo de reportes a usuarios en publicaciones
app.get("/getConteoReportesUsuarioPublicaciones", async (req, res) => {
    try {
        const result = await client.query(`
        WITH conteo AS (SELECT p.publicacion_id, p.autor_id, count(*) FROM p_reporte pr, publicacion p WHERE pr.publicacion_id = p.publicacion_id GROUP BY p.publicacion_id, p.autor_id)
        SELECT u.usuario_id, u.nombre_usuario, c.count FROM usuario u, conteo c WHERE c.autor_id = u.usuario_id ORDER BY c.count DESC
        `);

        const conteo_report_u_p = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(conteo_report_u_p)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer conteo de reportes a usuarios en comentarios
app.get("/getConteoReportesUsuarioComentarios", async (req, res) => {
    try {
        const result = await client.query(`
        WITH conteo AS (SELECT c.comentario_id, c.usuario_id, count(*) FROM c_reporte cr, comentario c WHERE cr.comentario_id = c.comentario_id GROUP BY c.comentario_id, c.usuario_id)
        SELECT u.usuario_id, u.nombre_usuario, c.count FROM usuario u, conteo c WHERE c.usuario_id = u.usuario_id ORDER BY c.count DESC
        `);

        const conteo_report_u_c = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(conteo_report_u_c)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer conteo de reportes a psicologos en posts
app.get("/getConteoReportesPsicologoPost", async (req, res) => {
    try {
        const result = await client.query(`
        WITH conteo AS (SELECT p.post_id, p.psicologo_id, count(*) FROM post_reporte pr, post p WHERE pr.post_id = p.post_id GROUP BY p.post_id, p.psicologo_id)
        SELECT p.nombre_1, p.apellido_1, c.count FROM psicologo p, conteo c WHERE c.psicologo_id = p.psicologo_id ORDER BY c.count DESC
        `);

        const conteo_report_p_p = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(conteo_report_p_p)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});


// get para traer a usuario en base a su id
app.get("/getUsuarioPorId", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario, u.edad, u.correo, ub.nombre,u.psicologos_seguidos, u.numero_telefono FROM usuario u, ubicacion ub 
        WHERE u.ubicacion_id = ub.ubicacion_id AND u.usuario_id = '${u.usuario_id}'
        `);

        const usuario_por_id = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(usuario_por_id)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a usuario en base a su nombre
app.get("/getUsuarioPorNombre", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT u.nombre_usuario, u.edad, u.correo, ub.nombre,u.psicologos_seguidos, u.numero_telefono FROM usuario u, ubicacion ub 
        WHERE u.ubicacion_id = ub.ubicacion_id AND u.usuario_id = '${u.nombre_usuario}'
        `);

        const usuario_por_nombre = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(usuario_por_nombre)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a psicologos hombres
app.get("/getPsicologoHombre", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT nombre_1, apellido_1, apellido_2, calificacion, numero_telefono, universidad, descripcion, sexo, cantidad_seguidores FROM psicologo WHERE sexo = 'Masculino'
        `);

        const psicologo_hombre = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_hombre)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});


// get para traer a psicologos mujeres
app.get("/getPsicologoMujer", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT nombre_1, apellido_1, apellido_2, calificacion, numero_telefono, universidad, descripcion, sexo, cantidad_seguidores FROM psicologo WHERE sexo = 'Femenino'
        `);

        const psicologo_mujer = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_mujer)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a psicologos en base a la ubicacion
app.get("/getPsicologoPorUbicacion", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT p.nombre_1, p.apellido_1, p.apellido_2, p.calificacion, p.numero_telefono, p.universidad, p.descripcion, p.sexo, p.cantidad_seguidores FROM psicologo p, usuario u, ubicacion ub 
        WHERE p.usuario_id = u.usuario_id AND u.ubicacion_id = ub.ubicacion_id AND ub.nombre = '${ub.nombre}'
        `);

        const psicologo_por_ubicacion = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_por_ubicacion)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a psicologos por orden de calificacion
app.get("/getPsicologoPorCalificacion", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT nombre_1, apellido_1, apellido_2, calificacion, numero_telefono, universidad, descripcion, sexo, cantidad_seguidores FROM psicologo ORDER BY calificacion DESC
        `);

        const psicologo_por_calificacion = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_por_calificacion)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a psicologos por orden de cantidad de seguidores
app.get("/getPsicologoPorSeguidores", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT nombre_1, apellido_1, apellido_2, calificacion, numero_telefono, universidad, descripcion, sexo, cantidad_seguidores FROM psicologo ORDER BY cantidad_seguidores DESC
        `);

        const psicologo_por_seguidores = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_por_seguidores)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer a las personas que un usuario sigue
app.get("/getUsuarioSigue", async (req, res) => {
    try {
        const result = await client.query(`
        WITH seguidos AS (SELECT u.usuario_id, u.nombre_usuario, s.seguido_id FROM usuario u, seguidor s WHERE u.usuario_id = s.seguidor_id)
        SELECT u.nombre_usuario FROM usuario u, seguidos s  WHERE u.usuario_id = s.seguido_id AND s.usuario_id = '${s.usuario_id}' 
        `);

        const usuario_sigue = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(usuario_sigue)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer hashtags ordenados por interes
app.get("/getHashtagInteres", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT hashtag_id, nivel_interes FROM usuario_hashtag ORDER BY nivel_interes desc
        `);

        const hashtag_interes = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(hashtag_interes)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// get para traer psicologo por su nombre
app.get("/getPsicologoPorNombre", async (req, res) => {
    try {
        const result = await client.query(`
        SELECT nombre_1,  apellido_1, apellido_2, calificacion, numero_telefono, universidad, descripcion, sexo FROM psicologo WHERE nombre_1 = '${nombre_1}'
        `);

        const psicologo_por_nombre = result.rows;
        // Respuesta de lo que retorno la BDD
        res.status(200).json(psicologo_por_nombre)

    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

//Faltan querys relacionadas con traer posts por la pregunta que dejé en documento (nose si debían traer imágenes o no xd)
//Falta lo de crear post, crear publicacion, todos los updates y delete

//INICIATE//
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
