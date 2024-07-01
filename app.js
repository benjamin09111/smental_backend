const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const mongoose = require('mongoose');

const User = require('./models/User');
const Publication = require('./models/publication');

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


//CONEXIÓN ESQL//

const connectionString = 'postgres://ahybdvnl:Y0VcIkj_nzu7_olq87gTBzJ8AkI0fxhd@otto.db.elephantsql.com/ahybdvnl';
const client = new Client({
    connectionString: connectionString,
});
client.connect();

//CONEXIÓN MONGODB//
const uri = "mongodb+srv://benssyca123:olakase123@cluster0.ndz7ajb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Reemplaza con tu cadena de conexión

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Conectado a MongoDB Atlas"))
.catch((error) => console.error("Error al conectar con MongoDB Atlas:", error));


////////////PETICIONES///////////


//registro
app.post("/registeruser", async (req, res) => {
    try {
        const { username, password, name, country, age, email, phone } = req.body;

        const type = 0; //0 free, 1 vip
        const banned = false;
        const reports = 0;

        // Check if email already exists
        const result1 = await client.query(
            `SELECT contact_id FROM contacts WHERE email = $1`,
            [email]
        );

        // Check if username already exists
        const result2 = await client.query(
            `SELECT user_id FROM users WHERE username = $1`,
            [username]
        );

        if (result1.rows.length > 0) {
            res.status(401).json({ message: "El correo ya está en uso" });
            return;
        } else if (result2.rows.length > 0) {
            res.status(401).json({ message: "El nombre de usuario ya está en uso" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const signup = await client.query(
            `
            INSERT INTO users (username, password, name, country, age, type, banned, reports) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING user_id
            `,
            [username, hashedPassword, name, country, parseInt(age), parseInt(type), banned, reports]
        );
        const userId = signup.rows[0].user_id;

        if (!userId) {
            res.status(400).json({ message: "fail" });
            return;
        }

        const signup2 = await client.query(
            `
            INSERT INTO contacts (user_id, email, phone) 
            VALUES ($1, $2, $3)
            `,
            [userId, email, phone]
        );
        const registrado2 = signup2.rowCount;

        if (registrado2 > 0) {
            res.status(200).json({ message: "success" });
        } else {
            res.status(400).json({ message: "fail" });
        }

    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: 'Error en la consulta' });
    }
});

app.post('/loginuser', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Seleccionar el usuario y la contraseña cifrada de la base de datos
        const result = await client.query(`
            SELECT user_id, password, banned FROM users WHERE username = '${username}'
        `);
        const user = result.rows[0];

        if (user) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                if (user.banned) {
                    res.status(401).json({ message: 'Esta cuenta está baneada' });
                    return;
                }

                const token = jwt.sign({ username }, secretKey, { expiresIn: '2d' });
                res.json({
                    message: "success",
                    userId: user.user_id, 
                    token: token
                });
            } else {
                res.status(401).json({ message: 'Credenciales incorrectas' });
            }
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error('Error en la consulta:', error);
        res.status(500).json({ message: 'Error en la consulta' });
    }
});

app.post('/loginadmin', async (req, res) => {
    try {
        //sacar del body la info
        const { username, password } = req.body;

        //poner la query a la db
        const result = await client.query(`
        SELECT admin_id FROM admins WHERE username = '${username}' AND password = '${password}'
        `);
        const result_query = result.rows;

        //verificar resultado obtenido de la db. La db devuelve un arreglo con los resultados en JSON
        if (result_query.length > 0) {
            const token = jwt.sign({ username }, secretKey, { expiresIn: '2d' });
            res.json({
                message: "success",
                resultado: result_query[0], //es solo 1 resultado efectivo
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Error de credenciales' });
        }
    } catch (error) {
        console.error('Error en la consulta GET:', error);
        res.status(500).json({ message: 'Error en la consulta GET' });
    }
});

// Ruta para crear un psicólogo
app.post('/create_psicologo', async (req, res) => {
    const {nombre, apellido, apellido_2, universidad, descripcion, sexo, edad, telefono, region, ciudad, comuna, pais, metodo} = req.body;
    try {
        const psychologist = new User({
                nombre: nombre,
                apellido: apellido,
                apellido_2: apellido_2,
                universidad: universidad,
                descripcion: descripcion,
                sexo: sexo,
                edad: parseInt(edad),
                telefono: telefono,
                region: region,
                ciudad: ciudad,
                comuna: comuna,
                pais: pais,
                metodo: metodo,
            });
        await psychologist.save();
        res.status(201).json({ message: "success"});
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

// Ruta para obtener todos los psicólogos
app.get('/get_psicologos', async (req, res) => {
    try {
        const psychologists = await User.find();
        res.json(psychologists);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Ruta para crear una nueva publicacion
app.post('/create_publication', async (req, res) => {
    try {
        const { titulo, descripcion, tematica, autor_id, imagen, nombre } = req.body;

        const publication = new Publication({
            titulo,
            descripcion,
            tematica,
            usuarioId: autor_id, // Asigna el ID del autor
            imagen,
            nombre
        });

        await publication.save();
        res.status(201).json({ message: "Publicación creada con éxito", publication });
        console.log('Publicación creada con éxito:', publication);
    } catch (error) {
        console.error('Error al crear la publicación:', error);
        res.status(500).json({ message: 'Error al crear la publicación' });
    }
});

// Ruta para obtener todas las publicaciones
app.get('/get_publications', async (req, res) => {
    try {
        const publications = await Publication.find().populate('usuarioId'); // Popula el documento del usuario
        console.log('Publicacines:', publications);
        res.status(200).json(publications);
    } catch (error) {
        console.error('Error al obtener las publicaciones:', error);
        res.status(500).json({ message: 'Error al obtener las publicaciones' });
    }
});

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

//INICIATE//
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
