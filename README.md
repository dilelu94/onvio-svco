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
node src/onvio-svco.js
```
