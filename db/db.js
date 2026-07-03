import express from 'express';
import multer from 'multer';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import postgres from 'postgres'; //important

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || ''; //important
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
const upload = multer({ dest: uploadsDir });
app.use('/uploads', express.static(uploadsDir));

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
		const { nombre, apellido, email, username, fechaNacimiento, contraseña, nroTelefono } = req.body;

		console.log('Received /auth/register request body:', {
			nombre,
			apellido,
			email,
			username,
			fechaNacimiento,
			nroTelefono,
			hasPassword: !!contraseña,
		});
		console.log('Received file:', req.file ? { originalname: req.file.originalname, filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size } : null);

		let fotoUrl = req.body.foto ?? '-1';
		if (req.file) {
			const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
			fotoUrl = fileUrl;
		}

		// Hash password (best-effort; you can replace with DB insert)
		const hashed = contraseña ? await bcrypt.hash(contraseña, 10) : '';

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