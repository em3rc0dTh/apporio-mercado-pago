# Motomuv Ambassador Day

[English](README.md) / [Español](README.es.md)

Este projeto é o backend e o aplicativo móvel para o evento **Motomuv Ambassador Day**. Ele permite que os usuários se registrem, façam login e paguem uma taxa de serviço fixa de **S/ 3.00** usando Yape ou Cartões de Crédito/Débito via Mercado Pago.

## Estrutura do Projeto

Este repositório contém duas partes principais:
1.  **Backend (`/`)**: Um servidor Node.js/Express que lida com autenticação, gerenciamento de saldo e pagamentos do Mercado Pago.
2.  **App Móvil (`/mobile`)**: Um aplicativo React Native (Expo) para os usuários interagirem com o serviço.

## Pré-requisitos

-   **Node.js**: v18 ou superior.
-   **MongoDB**: Usando MongoDB Local ou Atlas.
-   **Expo CLI**: Instalado globalmente (`npm install -g expo-cli`).

## Instruções de Configuração

### 1. Configuração do Backend

1.  Navegue até o diretório raiz.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as Variáveis de Ambiente:
    -   Certifique-se de ter um arquivo `.env` na raiz com as seguintes chaves:
        ```env
        MERCADO_PAGO_SAMPLE_PUBLIC_KEY=APP_USR-...
        MERCADO_PAGO_SAMPLE_ACCESS_TOKEN=APP_USR-...
        MONGO_URI=mongodb://localhost:27017/motomuv (ou sua URI Atlas)
        JWT_SECRET=seu_segredo_jwt
        ```
4.  Inicie o Servidor:
    ```bash
    npm start
    ```
    O servidor rodará em `http://localhost:8080`.

### 2. Configuração do App Móvel

1.  Navegue até o diretório móvel:
    ```bash
    cd mobile
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure a URL do Backend:
    -   Abra `mobile/screens/LoginScreen.js`, `mobile/screens/SignupScreen.js` e `mobile/App.js`.
    -   Atualize `BACKEND_URL` para o endereço IP local da sua máquina (ex: `http://192.168.1.33:8080`). **Não use `localhost`**, pois dispositivos/emuladores específicos não conseguem acessá-lo.

4.  Inicie o App:
    ```bash
    npx expo start --clear
    ```
5.  Escaneie o código QR com o app Expo Go (Android/iOS) ou execute em um emulador.

## Endpoints da API

-   `POST /auth/register`: Criar uma nova conta de usuário.
-   `POST /auth/login`: Autenticar um usuário e receber um token JWT.
-   `GET /get_balance`: Recuperar o saldo atual do usuário autenticado.
-   `GET /get_transactions`: Recuperar o histórico de transações.
-   `POST /process_payment`: Processar um pagamento via Mercado Pago (Yape ou Cartão).

## Funcionalidades do App Móvel

-   **Autenticação**: Telas de Login e Cadastro com tratamento de JWT.
-   **Painel**: Ver saldo e iniciar pagamentos.
-   **Preço Fixo**: Taxa de serviço travada em **S/ 3.00**.
-   **Métodos de Pagamento**:
    -   **Yape**: Gera um QR dinâmico (simulado em sandbox/teste).
    -   **Cartão**: Processamento de cartão de Crédito/Débito.
-   **Histórico de Transações**: Ver pagamentos anteriores em um modal.

## Documentação

A base de código está documentada com comentários JSDoc. Arquivos principais:
-   `mobile/App.js`: Lógica principal do aplicativo e orquestração de pagamentos.
-   `mobile/components/MovementsModal.js`: Interface do usuário do histórico de transações.
-   `controllers/`: Lógica de backend para pagamentos e autenticação.

---
*Powered by Motomuv & Mercado Pago*
