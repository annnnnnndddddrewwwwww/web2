// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a la base de datos usando la URL de Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Inicializar la tabla de reservas si no existe
async function initializeDb() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                date VARCHAR(255) NOT NULL,
                time VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'reservado',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("Tabla 'reservations' verificada o creada con éxito.");
    } catch (err) {
        console.error('Error al inicializar la base de datos', err);
    }
}

// Endpoint para obtener todas las reservas
app.get('/api/reservations', async (req, res) => {
    try {
        const result = await pool.query('SELECT date, time FROM reservations WHERE status = $1', ['reservado']);
        const bookedSlots = {};
        result.rows.forEach(row => {
            if (!bookedSlots[row.date]) {
                bookedSlots[row.date] = [];
            }
            bookedSlots[row.date].push(row.time);
        });
        res.json(bookedSlots);
    } catch (error) {
        console.error('Error al obtener reservas:', error.message);
        res.status(500).json({ error: 'Error al obtener reservas.' });
    }
});

// Endpoint para registrar una nueva reserva
app.post('/api/reserve', async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) {
        return res.status(400).json({ error: 'Faltan datos de fecha u hora.' });
    }

    try {
        const checkResult = await pool.query('SELECT * FROM reservations WHERE date = $1 AND time = $2 AND status = $3', [date, time, 'reservado']);
        if (checkResult.rowCount > 0) {
            return res.status(409).json({ error: 'Esta hora ya ha sido reservada.' });
        }

        const insertResult = await pool.query('INSERT INTO reservations (date, time) VALUES ($1, $2) RETURNING *', [date, time]);

        res.json({ message: 'Reserva registrada con éxito.', reservation: insertResult.rows[0] });
    } catch (error) {
        console.error('Error al registrar la reserva:', error.message);
        res.status(500).json({ error: 'Error al registrar la reserva.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    initializeDb();
});