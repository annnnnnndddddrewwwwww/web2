// server.js
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de la hoja de cálculo
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

// Credenciales de la cuenta de servicio (obtenidas de las variables de entorno)
const serviceAccountAuth = {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Función para conectar a la hoja y cargarla
async function connectToSheet() {
    try {
        await doc.useServiceAccountAuth(serviceAccountAuth);
        await doc.loadInfo();
        console.log(`Hoja de cálculo "${doc.title}" cargada.`);
    } catch (err) {
        console.error('Error al conectar a la hoja de cálculo:', err);
    }
}

// Inicializar la conexión
connectToSheet();

// Endpoint para obtener todas las reservas
app.get('/api/reservations', async (req, res) => {
    try {
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();
        const bookedSlots = {};
        rows.forEach(row => {
            const date = row.get('fecha');
            const time = row.get('hora');
            if (date && time) {
                if (!bookedSlots[date]) {
                    bookedSlots[date] = [];
                }
                bookedSlots[date].push(time);
            }
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
        const sheet = doc.sheetsByIndex[0];

        // Sección 1: Verificar si la hora ya está reservada
        const rows = await sheet.getRows();
        const isBooked = rows.some(row => row.get('fecha') === date && row.get('hora') === time);
        if (isBooked) {
            return res.status(409).json({ error: 'Esta hora ya ha sido reservada.' });
        }

        // Sección 2: Insertar la nueva reserva
        await sheet.addRow({ fecha: date, hora: time });

        res.json({ message: 'Reserva registrada con éxito.', reservation: { date, time } });
    } catch (error) {
        console.error('Error al registrar la reserva:', error.message);
        res.status(500).json({ error: 'Error al registrar la reserva.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});