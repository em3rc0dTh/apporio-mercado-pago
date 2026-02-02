# Motomuv Ambassador Day

[English](README.md) / [Português](README.pt.md)

Este proyecto es el backend y la aplicación móvil para el evento **Motomuv Ambassador Day**. Permite a los usuarios registrarse, iniciar sesión y pagar una tarifa de servicio fija de **S/ 3.00** utilizando Yape o Tarjetas de Crédito/Débito a través de Mercado Pago.

## Estructura del Proyecto

Este repositorio contiene dos partes principales:
1.  **Backend (`/`)**: Un servidor Node.js/Express que maneja la autenticación, gestión de saldos y pagos de Mercado Pago.
2.  **App Móvil (`/mobile`)**: Una aplicación React Native (Expo) para que los usuarios interactúen con el servicio.

## Requisitos Previos

-   **Node.js**: v18 o superior.
-   **MongoDB**: Usando MongoDB Local o Atlas.
-   **Expo CLI**: Instalado globalmente (`npm install -g expo-cli`).

## Instrucciones de Configuración

### 1. Configuración del Backend

1.  Navega al directorio raíz.
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Configura las Variables de Entorno:
    -   Asegúrate de tener un archivo `.env` en la raíz con las siguientes claves:
        ```env
        MERCADO_PAGO_SAMPLE_PUBLIC_KEY=APP_USR-...
        MERCADO_PAGO_SAMPLE_ACCESS_TOKEN=APP_USR-...
        MONGO_URI=mongodb://localhost:27017/motomuv (o tu URI de Atlas)
        JWT_SECRET=tu_secreto_jwt
        ```
4.  Inicia el Servidor:
    ```bash
    npm start
    ```
    El servidor se ejecutará en `http://localhost:8080`.

### 2. Configuración de la App Móvil

1.  Navega al directorio móvil:
    ```bash
    cd mobile
    ```
2.  Instale las dependencias:
    ```bash
    npm install
    ```
3.  Configura la URL del Backend:
    -   Abre `mobile/screens/LoginScreen.js`, `mobile/screens/SignupScreen.js`, y `mobile/App.js`.
    -   Actualiza `BACKEND_URL` a la dirección IP local de tu máquina (ej. `http://192.168.1.33:8080`). **No uses `localhost`** ya que los dispositivos/emuladores requieren la IP de red.

4.  Inicia la App:
    ```bash
    npx expo start --clear
    ```
5.  Escanea el código QR con la app Expo Go (Android/iOS) o ejecuta en un emulador.

## Endpoints de la API

-   `POST /auth/register`: Crear una nueva cuenta de usuario.
-   `POST /auth/login`: Autenticar un usuario y recibir un token JWT.
-   `GET /get_balance`: Obtener el saldo actual del usuario autenticado.
-   `GET /get_transactions`: Obtener el historial de transacciones.
-   `POST /process_payment`: Procesar un pago a través de Mercado Pago (Yape o Tarjeta).

## Características de la App Móvil

-   **Autenticación**: Pantallas de Inicio de Sesión y Registro con manejo de JWT.
-   **Panel de Control**: Ver saldo e iniciar pagos.
-   **Precio Fijo**: Tarifa de servicio bloqueada en **S/ 3.00**.
-   **Métodos de Pago**:
    -   **Yape**: Genera un QR dinámico (simulado en sandbox/test).
    -   **Tarjeta**: Procesamiento de tarjetas de Crédito/Débito.
-   **Historial de Transacciones**: Ver pagos pasados en un modal.

## Documentación

El código base está documentado con comentarios JSDoc. Archivos clave:
-   `mobile/App.js`: Lógica principal de la aplicación y orquestación de pagos.
-   `mobile/components/MovementsModal.js`: Interfaz de usuario del historial de transacciones.
-   `controllers/`: Lógica del backend para pagos y autenticación.

---
*Powered by Motomuv & Mercado Pago*
