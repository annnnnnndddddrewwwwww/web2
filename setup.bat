@echo off
chcp 65001 >nul
cls

echo ========================================
echo 🚀 NovaShop Sistema de Reservas
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js instalado
node --version
echo.

REM Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)

echo ✅ npm instalado
npm --version
echo.

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencias instaladas correctamente
) else (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)

echo.

REM Verificar .env
if not exist .env (
    echo ⚠️  Archivo .env no encontrado
    echo Creando archivo .env de ejemplo...
    
    (
        echo # Google Sheets
        echo SHEET_ID=tu_sheet_id_aqui
        echo.
        echo # Google Service Account
        echo CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
        echo PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
        echo.
        echo # Google Calendar
        echo CALENDAR_ID=primary
        echo.
        echo # Email ^(Gmail^)
        echo EMAIL_USER=tu_email@gmail.com
        echo EMAIL_PASS=tu_app_password_aqui
        echo ADMIN_EMAIL=tu_email@gmail.com
        echo.
        echo # Servidor
        echo PORT=3000
    ) > .env
    
    echo ✅ Archivo .env creado
    echo ⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales
    echo.
) else (
    echo ✅ Archivo .env encontrado
)

REM Verificar credentials.json
if not exist credentials.json (
    echo ⚠️  Archivo credentials.json no encontrado
    echo Por favor, descarga tu archivo de credenciales de Google Cloud
    echo y guárdalo como 'credentials.json' en este directorio
    echo.
) else (
    echo ✅ Archivo credentials.json encontrado
)

echo.
echo ================================================
echo ✅ Instalación completada!
echo ================================================
echo.
echo 📝 Próximos pasos:
echo.
echo 1. Configura tus credenciales en el archivo .env
echo 2. Asegúrate de tener credentials.json en el directorio
echo 3. Ejecuta 'npm start' para iniciar el servidor backend
echo 4. O ejecuta 'npm run electron' para la aplicación de escritorio
echo.
echo 📚 Lee el README.md para más información
echo.
echo 🎉 ¡Buena suerte con tu sistema de reservas!
echo.
pause