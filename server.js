// server.js
const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de Google Sheets
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

// Configuración de Google Calendar
const calendar = google.calendar('v3');
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/spreadsheets'
    ],
});

// Configuración de Nodemailer (para enviar emails)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password de Gmail
    },
});

// Credenciales de la cuenta de servicio
const serviceAccountAuth = {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Función para conectar a Google Sheets
async function connectToSheet() {
    try {
        await doc.useServiceAccountAuth(serviceAccountAuth);
        await doc.loadInfo();
        console.log(`✅ Hoja de cálculo "${doc.title}" cargada.`);
    } catch (err) {
        console.error('❌ Error al conectar a Google Sheets:', err);
    }
}

// Inicializar conexión
connectToSheet();

// Función para crear evento en Google Calendar
async function createCalendarEvent(eventData) {
    try {
        const authClient = await auth.getClient();

        const event = {
            summary: `${eventData.serviceName} - ${eventData.clientName || 'Cliente'}`,
            description: `
                Servicio: ${eventData.serviceName}
                Cliente: ${eventData.clientName || 'No especificado'}
                Email: ${eventData.email || 'No especificado'}
                Teléfono: ${eventData.phone || 'No especificado'}
                Precio: €${eventData.price}
            `,
            start: {
                dateTime: eventData.startDateTime,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: eventData.endDateTime,
                timeZone: 'Europe/Madrid',
            },
            attendees: eventData.email ? [{ email: eventData.email }] : [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 día antes
                    { method: 'popup', minutes: 60 }, // 1 hora antes
                ],
            },
        };

        const response = await calendar.events.insert({
            auth: authClient,
            calendarId: process.env.CALENDAR_ID || 'primary',
            resource: event,
            sendUpdates: 'all', // Enviar invitación al cliente
        });

        console.log('✅ Evento creado en Google Calendar:', response.data.htmlLink);
        return response.data;
    } catch (error) {
        console.error('❌ Error al crear evento en Calendar:', error);
        throw error;
    }
}

// Función para enviar email de notificación
async function sendEmailNotification(type, data) {
    try {
        let subject, html;

        switch (type) {
            case 'contact':
                subject = `📧 Nuevo mensaje de contacto - ${data.name}`;
                html = `
                    <h2>Nuevo mensaje de contacto</h2>
                    <p><strong>Nombre:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Teléfono:</strong> ${data.phone || 'No especificado'}</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>${data.message}</p>
                    <hr>
                    <p><small>Enviado desde NovaShop el ${new Date().toLocaleString('es-ES')}</small></p>
                `;
                break;

            case 'free_consultation':
                subject = `📞 Nueva reserva de llamada gratuita - ${data.clientName}`;
                html = `
                    <h2>Nueva reserva de llamada gratuita (15 min)</h2>
                    <p><strong>Cliente:</strong> ${data.clientName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Teléfono:</strong> ${data.phone}</p>
                    <p><strong>Fecha:</strong> ${data.date}</p>
                    <p><strong>Hora:</strong> ${data.time}</p>
                    <hr>
                    <p><a href="${data.calendarLink}">Ver en Google Calendar</a></p>
                `;
                break;

            case 'paid_reservation':
                subject = `💰 Nueva reserva de pago - ${data.serviceName}`;
                html = `
                    <h2>Nueva reserva de servicio pagado</h2>
                    <p><strong>Servicio:</strong> ${data.serviceName}</p>
                    <p><strong>Precio:</strong> €${data.price}</p>
                    <p><strong>Cliente:</strong> ${data.clientName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Teléfono:</strong> ${data.phone}</p>
                    <p><strong>Fecha:</strong> ${data.date}</p>
                    <p><strong>Hora:</strong> ${data.time}</p>
                    <p><strong>ID de transacción:</strong> ${data.transactionId}</p>
                    <hr>
                    <p><a href="${data.calendarLink}">Ver en Google Calendar</a></p>
                `;
                break;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: subject,
            html: html,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado:', subject);
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
    }
}

// ENDPOINT: Obtener todas las reservas
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
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ error: 'Error al obtener reservas.' });
    }
});

// ENDPOINT: Reserva de llamada gratuita (con datos de contacto)
app.post('/api/reserve-free', async (req, res) => {
    const { date, time, clientName, email, phone } = req.body;

    if (!date || !time || !clientName || !email || !phone) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const sheet = doc.sheetsByIndex[0];

        // Verificar disponibilidad
        const rows = await sheet.getRows();
        const isBooked = rows.some(row => row.get('fecha') === date && row.get('hora') === time);

        if (isBooked) {
            return res.status(409).json({ error: 'Esta hora ya ha sido reservada.' });
        }

        // Crear evento en Google Calendar
        const [year, month, day] = date.split('-');
        const [hour, minute] = time.split(':');
        const startDateTime = new Date(year, month - 1, day, hour, minute);
        const endDateTime = new Date(startDateTime.getTime() + 15 * 60000); // +15 minutos

        const calendarEvent = await createCalendarEvent({
            serviceName: 'Llamada Gratuita 15 min',
            clientName,
            email,
            phone,
            price: 0,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
        });

        // Guardar en Google Sheets
        await sheet.addRow({
            fecha: date,
            hora: time,
            servicio: 'Llamada Gratuita',
            cliente: clientName,
            email: email,
            telefono: phone,
            precio: 0,
            estado: 'Confirmada',
            calendarEventId: calendarEvent.id,
        });

        // Enviar notificación por email
        await sendEmailNotification('free_consultation', {
            clientName,
            email,
            phone,
            date,
            time,
            calendarLink: calendarEvent.htmlLink,
        });

        res.json({
            message: 'Reserva gratuita confirmada con éxito.',
            reservation: { date, time, clientName },
            calendarLink: calendarEvent.htmlLink,
        });
    } catch (error) {
        console.error('Error al registrar reserva gratuita:', error);
        res.status(500).json({ error: 'Error al registrar la reserva.' });
    }
});

// ENDPOINT: Reserva de servicio pagado (después del pago de PayPal)
app.post('/api/reserve-paid', async (req, res) => {
    const { date, time, serviceId, serviceName, price, clientName, email, phone, transactionId } = req.body;

    if (!date || !time || !serviceName || !price || !clientName || !email || !transactionId) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        const sheet = doc.sheetsByIndex[0];

        // Verificar disponibilidad
        const rows = await sheet.getRows();
        const isBooked = rows.some(row => row.get('fecha') === date && row.get('hora') === time);

        if (isBooked) {
            return res.status(409).json({ error: 'Esta hora ya ha sido reservada.' });
        }

        // Duración según el servicio
        const duration = serviceId === 2 ? 60 : 30; // Consulta inicial: 60 min, Seguimiento: 30 min

        // Crear evento en Google Calendar
        const [year, month, day] = date.split('-');
        const [hour, minute] = time.split(':');
        const startDateTime = new Date(year, month - 1, day, hour, minute);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        const calendarEvent = await createCalendarEvent({
            serviceName,
            clientName,
            email,
            phone,
            price,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
        });

        // Guardar en Google Sheets
        await sheet.addRow({
            fecha: date,
            hora: time,
            servicio: serviceName,
            cliente: clientName,
            email: email,
            telefono: phone || 'No especificado',
            precio: price,
            estado: 'Pagada',
            transactionId: transactionId,
            calendarEventId: calendarEvent.id,
        });

        // Enviar notificación por email
        await sendEmailNotification('paid_reservation', {
            serviceName,
            price,
            clientName,
            email,
            phone,
            date,
            time,
            transactionId,
            calendarLink: calendarEvent.htmlLink,
        });

        res.json({
            message: 'Reserva pagada confirmada con éxito.',
            reservation: { date, time, serviceName, clientName },
            calendarLink: calendarEvent.htmlLink,
        });
    } catch (error) {
        console.error('Error al registrar reserva pagada:', error);
        res.status(500).json({ error: 'Error al registrar la reserva.' });
    }
});

// ENDPOINT: Formulario de contacto
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    try {
        // Guardar en Google Sheets (hoja de contactos)
        const contactSheet = doc.sheetsByTitle['Contactos'] || doc.sheetsByIndex[1];

        if (contactSheet) {
            await contactSheet.addRow({
                fecha: new Date().toLocaleString('es-ES'),
                nombre: name,
                email: email,
                telefono: phone || 'No especificado',
                mensaje: message,
            });
        }

        // Enviar notificación por email
        await sendEmailNotification('contact', { name, email, phone, message });

        res.json({ message: 'Mensaje enviado con éxito. Te contactaremos pronto.' });
    } catch (error) {
        console.error('Error al procesar contacto:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje.' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📧 Email configurado: ${process.env.EMAIL_USER}`);
    console.log(`📅 Calendar ID: ${process.env.CALENDAR_ID || 'primary'}`);
});