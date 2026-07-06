import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import postgres from 'postgres'; //important

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const databasePassword = process.env.DATABASE_PASSWORD || '';
const databasePort = process.env.DB_PORT || '5432';
const connectionString = process.env.DATABASE_URL
  .replace('[DATABASE_PASSWORD]', databasePassword)
  .replace('[DB_PORT]', databasePort);

if (!connectionString) {
  console.error('DATABASE_URL no está definido. Revisa el archivo .env raíz.');
} else {
  const safeUrl = connectionString.replace(/:[^:@]*@/, ':*****@');
  console.log('DB connection string:', safeUrl);
  if (connectionString.includes('[DATABASE_PASSWORD]') || connectionString.includes('[PORT]')) {
    console.warn('DATABASE_URL contiene placeholders sin reemplazar. Se aplicó reemplazo automático con DATABASE_PASSWORD y DATABASE_PORT.');
  }
}

const sql = postgres(connectionString); //important

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
// Ensure uploads directory exists
try {
	fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
	console.warn('Could not create uploads directory', e);
}
// 1. Configuración del almacenamiento para conservar extensiones
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, 'uploads');
    // Asegura que la carpeta exista
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Extraemos la extensión original (.png, .jpg, etc.)
    const ext = path.extname(file.originalname) || '.jpg';
    // Creamos un nombre único usando la fecha actual y un número aleatorio
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health root route
app.get('/', (req, res) => {
	res.type('html');
	res.send(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>Auth mock server</title>
</head>
<body>
	<h1>Auth mock server is running</h1>
	<p>Available endpoints: <code>/auth/register</code>, <code>/uploads/*</code></p>
</body>
</html>`);
});

// Simple register endpoint that accepts multipart/form-data (foto file)
app.post('/auth/register', upload.single('foto'), async (req, res) => {
	try {
		const { nombre, apellido, email, username, fechaNacimiento, contraseña, password, nroTelefono } = req.body;
		const rawPassword = contraseña ?? password ?? '';
		const parsedPhone = (() => {
			const value = Number(nroTelefono);
			return Number.isNaN(value) ? null : value;
		})();

		console.log('Received /auth/register request body:', {
			nombre,
			apellido,
			email,
			username,
			fechaNacimiento,
			nroTelefono: parsedPhone,
			hasPassword: !!rawPassword,
			passwordSource: contraseña ? 'contraseña' : password ? 'password' : 'none',
		});
		console.log('Raw req.body keys:', Object.keys(req.body));
		console.log('Received file:', req.file ? { originalname: req.file.originalname, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null);

		let fotoUrl = '-1';
		if (req.file) {
			// Si Multer recibió el archivo con éxito, generamos su URL local
			fotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
		} else if (req.body.foto && typeof req.body.foto === 'string' && req.body.foto !== '[object Object]') {
			// Si no es un archivo, pero es una cadena de texto o URL válida escrita a mano
			fotoUrl = req.body.foto;
		}

		// Hash password (best-effort; you can replace with DB insert)
		const hashed = rawPassword ? await bcrypt.hash(rawPassword, 10) : '';

		// Persist into DB using `sql` (postgres client). Expect table "Usuarios" with columns
		// "nombre","apellido","email","username","fechaNacimiento","contraseña","nroTelefono","foto".
		try {
			const result = await sql`
				INSERT INTO "Usuarios"
					("nombre","apellido","email","username","fechaNacimiento","contraseña","nroTelefono","foto")
				VALUES (
					${nombre}, ${apellido}, ${email}, ${username}, ${fechaNacimiento}, ${hashed}, ${nroTelefono ? Number(nroTelefono) : null}, ${fotoUrl}
				)
				RETURNING *
			`;

			const created = result[0];
			const user = {
				id: created.id,
				nombre: created.nombre,
				apellido: created.apellido,
				email: created.email,
				username: created.username,
				nroTelefono: created.nroTelefono,
				foto: created.foto,
				fechaNacimiento: created.fechaNacimiento,
			};

			const accessToken = 'dev-access-token';
			const refreshToken = 'dev-refresh-token';

			return res.json({ accessToken, refreshToken, user });
		} catch (dbErr) {
			console.error('DB insert error', dbErr);
			// unique violation
			if (dbErr && dbErr.code === '23505') {
				return res.status(409).json({ message: 'El usuario o email ya está registrado.' });
			}
			return res.status(500).json({ message: 'DB error' });
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: 'Server error' });
	}
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => console.log(`Auth mock server listening on http://localhost:${PORT}`));

export default sql;