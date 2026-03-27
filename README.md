# Onvio-SVCO
Automatización de actualización de montos en matriz de Onvio.

## Configuración (.env)
Crea un archivo `.env` en el root de esta carpeta (`onvio-helper/onvio-svco/`) con el siguiente formato:

```env
ONVIO_USER=tu_usuario
ONVIO_PASS=tu_contrasena
MONTO_ACTUALIZAR=424,62
```

## Ejecución
Este script itera sobre `companies.txt` y actualiza el monto en la matriz.
Requiere Node.js y Playwright.

```bash
npm install
npm start
```

## GitHub Actions
Este proyecto incluye un workflow de GitHub Actions para automatizar el proceso.
Para que funcione, debes configurar los siguientes **Secrets** en tu repositorio de GitHub:

1. `ONVIO_USER`: Correo electrónico de acceso.
2. `ONVIO_PASS`: Contraseña de acceso.
3. `MONTO_ACTUALIZAR`: (Opcional) Monto por defecto si no se especifica en el trigger.
