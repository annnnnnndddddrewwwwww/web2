# 📅 NovaShop - Sistema de Reservas con Google Calendar

Sistema completo de reservas con integración a Google Calendar, notificaciones por email y aplicación de escritorio.

## 🚀 Características

- ✅ **Google Calendar**: Sincronización automática de reservas
- ✅ **Notificaciones Email**: Recibe notificaciones de contactos, reservas gratuitas y pagadas
- ✅ **PayPal Integration**: Pagos seguros integrados
- ✅ **Google Sheets**: Almacenamiento de datos en tiempo real
- ✅ **Aplicación de Escritorio**: Con Electron para Windows, Mac y Linux
- ✅ **Interfaz Moderna**: Diseño glassmorphism con animaciones

## 📋 Requisitos Previos

- **Node.js** v14 o superior
- **npm** o **yarn**
- Cuenta de **Google Cloud Platform**
- Cuenta de **Gmail** (para envío de emails)
- Cuenta de **PayPal Developer** (para pagos)

## 🛠️ Instalación Paso a Paso

### 1. Configurar Google Cloud Platform

#### A) Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - **Google Sheets API**
   - **Google Calendar API**

#### B) Crear Service Account

1. Ve a **IAM & Admin** > **Service Accounts**
2. Clic en **Create Service Account**
3. Nombre: `novashop-service`
4. Rol: **Editor** o roles específicos:
   - `roles/calendar.editor`
   - `roles/sheets.editor`
5. Clic en **Create Key** > **JSON**
6. Guarda el archivo (será tu `credentials.json`)

#### C) Configurar Google Sheets

1. Crea una nueva hoja de cálculo en [Google Sheets](https://sheets.google.com)
2. Crea dos hojas:
   - **Hoja 1**: "Reservas" con columnas:
     - fecha | hora | servicio | cliente | email | telefono | precio | estado | transactionId | calendarEventId
   - **Hoja 2**: "Contactos" con columnas:
     - fecha | nombre | email | telefono | mensaje
3. Comparte la hoja con el email del service account (`CLIENT_EMAIL` del JSON)
4. Dale permisos de **Editor**
5. Copia el **SHEET_ID** de la URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

#### D) Configurar Google Calendar

1. Ve a [Google Calendar](https://calendar.google.com)
2. En la barra lateral izquierda, clic en "+" junto a "Otros calendarios"
3. Selecciona **Crear nuevo calendario**
4. Nombre: "NovaShop Reservas"
5. Clic en **Crear calendario**
6. Ve a **Configuración del calendario** > **Integrar calendario**
7. Copia el **ID del calendario** (ejemplo: `abc123@group.calendar.google.com`)
8. En **Compartir con determinadas personas**, añade el email del service account con permisos de **Realizar cambios en los eventos**

### 2. Configurar Gmail para Envío de Emails

#### A) Crear App Password

1. Ve a [Cuenta de Google](https://myaccount.google.com/)
2. Ve a **Seguridad** > **Verificación en dos pasos** (actívala si no lo está)
3. En **Seguridad**, busca **Contraseñas de aplicaciones**
4. Selecciona **Correo** y **Otro (nombre personalizado)**
5. Escribe: "NovaShop Backend"
6. Copia la contraseña generada ytfd pswz tpsd pxjz

### 3. Configurar PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una aplicación en **Dashboard** > **My Apps & Credentials**
3. Copia el **Client ID** (para modo Sandbox primero, luego producción)
4. Actualiza en `index.html` la línea del SDK de PayPal:
```html
<script src="https://www.paypal.com/sdk/js?client-id=TU_CLIENT_ID&currency=EUR"></script>
```

### 4. Instalar el Proyecto

```bash
# Clonar o descargar el proyecto
cd novashop-reservation-system

# Instalar dependencias
npm install

# O con yarn
yarn install
```

### 5. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Google Sheets
SHEET_ID=tu_sheet_id_aqui

# Google Service Account (del archivo credentials.json)
CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_COMPLETA_AQUI\n-----END PRIVATE KEY-----\n"

# Google Calendar
CALENDAR_ID=tu-calendar-id@group.calendar.google.com
# O usa 'primary' para tu calendario principal

# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_de_16_caracteres
ADMIN_EMAIL=tu_email@gmail.com

# Servidor
PORT=3000
```

**Nota importante sobre PRIVATE_KEY**: 
- Debe estar entre comillas dobles
- Los saltos de línea deben ser literales `\n`
- Copia todo el contenido desde `-----BEGIN PRIVATE KEY-----` hasta `-----END PRIVATE KEY-----`

### 6. Ejecutar el Proyecto

#### Modo Desarrollo (Solo Backend)

```bash
npm start
# o con nodemon para auto-reload
npm run dev
```

El servidor estará en: `http://localhost:3000`

#### Aplicación de Escritorio (Electron)

```bash
# Iniciar aplicación de escritorio
npm run electron
```

### 7. Compilar Aplicación de Escritorio

#### Para Windows:
```bash
npm run build:win
```

#### Para Mac:
```bash
npm run build:mac
```

#### Para Linux:
```bash
npm run build:linux
```

Los archivos compilados estarán en la carpeta `dist/`

## 📁 Estructura del Proyecto

```
novashop-reservation-system/
├── server.js              # Backend Express con APIs
├── main.js                # Electron main process
├── index.html             # Frontend de la aplicación
├── credentials.json       # Credenciales de Google (no subir a Git)
├── .env                   # Variables de entorno (no subir a Git)
├── package.json           # Dependencias y scripts
├── README.md              # Este archivo
├── icon.png               # Icono de la app (256x256)
├── icon.ico               # Icono Windows
└── icon.icns              # Icono macOS
```

## 🔧 APIs Disponibles

### GET `/api/reservations`
Obtiene todas las reservas desde Google Sheets

### POST `/api/reserve-free`
Registra una reserva gratuita (llamada de 15 min)
```json
{
  "date": "2024-12-25",
  "time": "10:00",
  "clientName": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "+34600000000"
}
```

### POST `/api/reserve-paid`
Registra una reserva pagada después del pago de PayPal
```json
{
  "date": "2024-12-25",
  "time": "11:00",
  "serviceId": 2,
  "serviceName": "Consulta Inicial",
  "price": 70,
  "clientName": "María García",
  "email": "maria@email.com",
  "phone": "+34600000001",
  "transactionId": "PAYPAL_TRANSACTION_ID"
}
```

### POST `/api/contact`
Envía un mensaje del formulario de contacto
```json
{
  "name": "Pedro López",
  "email": "pedro@email.com",
  "phone": "+34600000002",
  "message": "Quisiera más información..."
}
```

### GET `/health`
Verifica el estado del servidor

## 📧 Emails que se Envían

El sistema envía automáticamente emails en estos casos:

1. **Formulario de Contacto**: Cuando alguien envía un mensaje
2. **Reserva Gratuita**: Cuando se reserva una llamada de 15 min
3. **Reserva Pagada**: Cuando se completa un pago y reserva

Cada email incluye:
- Datos del cliente
- Detalles de la reserva/mensaje
- Enlace directo al evento en Google Calendar (para reservas)

## 🗓️ Google Calendar

Cada reserva crea automáticamente un evento en tu Google Calendar con:
- Título descriptivo
- Descripción con todos los datos del cliente
- Hora de inicio y fin
- Invitación al cliente (si proporcionó email)
- Recordatorios automáticos:
  - Email 24 horas antes
  - Popup 1 hora antes

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `index.html`:

```css
:root {
    --primary: #6366f1;
    --secondary: #10b981;
    --accent: #f59e0b;
    --neon-blue: #00d4ff;
    --neon-purple: #b829ff;
    --neon-pink: #ff006e;
}
```

### Modificar Servicios

Edita el array `products` en `index.html`:

```javascript
const products = [
    { 
        id: 1, 
        name: 'Tu Servicio', 
        price: 50, 
        img: 'URL_IMAGEN',
        desc: 'Descripción del servicio',
        badge: 'Etiqueta'
    },
    // ... más servicios
];
```

### Ajustar Horarios Disponibles

En `server.js`, modifica la función `loadAvailability()` para cambiar los horarios:

```javascript
availability[dateStr] = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
```

## 🔒 Seguridad

- ✅ Nunca subas `.env` ni `credentials.json` a Git
- ✅ Usa variables de entorno para datos sensibles
- ✅ Activa verificación en 2 pasos en Gmail
- ✅ Usa App Passwords en lugar de contraseña real
- ✅ Revisa permisos del service account regularmente

## 🐛 Solución de Problemas

### Error: "Error al conectar a Google Sheets"
- Verifica que el `SHEET_ID` sea correcto
- Confirma que el service account tiene permisos en la hoja
- Revisa que `PRIVATE_KEY` esté correctamente formateado con `\n`

### Error: "Error al crear evento en Calendar"
- Verifica que el `CALENDAR_ID` sea correcto
- Confirma que el service account tenga permisos en el calendario
- Verifica que la Google Calendar API esté habilitada

### No llegan los emails
- Verifica que `EMAIL_USER` y `EMAIL_PASS` sean correctos
- Confirma que uses un App Password, no tu contraseña de Gmail
- Revisa la carpeta de spam
- Verifica que la verificación en 2 pasos esté activa

### PayPal no funciona
- Verifica que el `client-id` en el SDK sea correcto
- En desarrollo, usa credenciales de Sandbox
- En producción, cambia a credenciales reales

## 📱 Despliegue en Producción

### Backend en Servidor

1. Usa un servicio como:
   - **Heroku**: `heroku create novashop-backend`
   - **Railway**: Conecta tu repositorio
   - **DigitalOcean**: Crea un droplet
   - **AWS EC2**: Lanza una instancia

2. Configura las variables de entorno en el servidor

3. Actualiza `API_URL` en `index.html`:
```javascript
const API_URL = 'https://tu-backend.herokuapp.com/api';
```

### Aplicación de Escritorio

Distribuye los ejecutables compilados:
- Windows: `.exe` en `dist/`
- Mac: `.dmg` en `dist/`
- Linux: `.AppImage` en `dist/`

## 📞 Soporte

Para preguntas o problemas:
- Email: tu@email.com
- GitHub Issues: [tu-repo/issues](https://github.com/tu-repo/issues)

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

Hecho con ❤️ por NovaShop Team