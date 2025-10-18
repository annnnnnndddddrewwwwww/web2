#!/bin/bash

# Script de instalación automática para NovaShop
# Sistema de Reservas con Google Calendar

echo "🚀 Iniciando instalación de NovaShop Sistema de Reservas..."
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js instalado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm instalado: $(npm --version)"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo ""

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo "Creando archivo .env de ejemplo..."
    
    cat > .env << 'EOF'
# Google Sheets
SHEET_ID=tu_sheet_id_aqui

# Google Service Account
CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"

# Google Calendar
CALENDAR_ID=primary

# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_aqui
ADMIN_EMAIL=tu_email@gmail.com

# Servidor
PORT=3000
EOF

    echo "✅ Archivo .env creado"
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    echo ""
else
    echo "✅ Archivo .env encontrado"
fi

# Verificar credentials.json
if [ ! -f credentials.json ]; then
    echo "⚠️  Archivo credentials.json no encontrado"
    echo "Por favor, descarga tu archivo de credenciales de Google Cloud"
    echo "y guárdalo como 'credentials.json' en este directorio"
    echo ""
else
    echo "✅ Archivo credentials.json encontrado"
fi

echo ""
echo "================================================"
echo "✅ Instalación completada!"
echo "================================================"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configura tus credenciales en el archivo .env"
echo "2. Asegúrate de tener credentials.json en el directorio"
echo "3. Ejecuta 'npm start' para iniciar el servidor backend"
echo "4. O ejecuta 'npm run electron' para la aplicación de escritorio"
echo ""
echo "📚 Lee el README.md para más información"
echo ""
echo "🎉 ¡Buena suerte con tu sistema de reservas!"
echo ""