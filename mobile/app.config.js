import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Manually read the root .env file since dotenv/config only reads from CWD by default
// and we want the parent directory's .env
const rootEnvPath = path.resolve(__dirname, '../.env');
console.log("DEBUG: app.config.js - Resolving .env at:", rootEnvPath);

if (fs.existsSync(rootEnvPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(rootEnvPath));
    console.log("DEBUG: app.config.js - Loaded config keys:", Object.keys(envConfig));
    console.log("DEBUG: app.config.js - Found Public Key:", envConfig.MERCADO_PAGO_SAMPLE_PUBLIC_KEY);
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.log("DEBUG: app.config.js - .env file NOT FOUND at:", rootEnvPath);
}

export default {
    expo: {
        name: "mobile",
        slug: "mobile",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            "expo-asset"
        ],
        extra: {
            publicKey: process.env.MERCADO_PAGO_SAMPLE_PUBLIC_KEY
        }
    }
};
