# MarBraYon - Tienda de Ropa Deportiva 👟👕

![MarBraYon Banner](./public/Ima/LOGO.png)

**MarBraYon** es una plataforma de e-commerce (comercio electrónico) especializada en la venta de ropa y artículos deportivos. Este proyecto fue desarrollado desde cero con el objetivo de brindar una experiencia de usuario fluida e intuitiva para la compra de equipamiento deportivo.

## 🚀 Tecnologías Utilizadas

Este proyecto está construido utilizando tecnologías modernas de desarrollo web:

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript, EJS (Embedded JavaScript templating), Materialize CSS
- **Base de Datos:** MySQL
- **Integraciones:** Transbank SDK (para pagos), Sendinblue API (para correos transaccionales)

## 🛠️ Instalación y Configuración Local

Si deseas correr este proyecto de forma local, sigue estos pasos:

1. Clona este repositorio:
   ```bash
   git clone https://github.com/MartinQuintana2077/marbrayon.git
   ```
2. Accede al directorio del proyecto e instala las dependencias:
   ```bash
   cd marbrayon
   npm install
   ```
3. Configura tu base de datos MySQL local y asegúrate de agregar las credenciales correspondientes.
4. Crea un archivo `.env` en la raíz del proyecto y agrega las variables de entorno necesarias (por ejemplo, tu clave de la API de Sendinblue):
   ```env
   SENDINBLUE_API_KEY=tu_clave_aqui
   ```
5. Inicia la aplicación:
   - Puedes usar el archivo `iniciar.bat` si estás en Windows.
   - O ejecutar directamente en la consola:
     ```bash
     node app.js
     ```
6. Abre tu navegador en `http://localhost:3000`

## 👥 Equipo de Desarrollo

Este proyecto fue ideado y desarrollado por:

- **Mar**tin Quintana
- **Bra**ndon Melinao
- **Yon**ny Maldonado

---
*Este proyecto es parte de nuestro portafolio de desarrollo.*