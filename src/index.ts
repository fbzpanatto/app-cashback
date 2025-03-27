if (process.env.NODE_ENV !== 'production'){ require('dotenv').config() }

import { Client, LocalAuth } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import express, {Application, Router} from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';

import { WhatsappRouter } from "./controllers/whatsapp";
import { SaleRouter } from "./controllers/sale";
import { ParameterRouter } from "./controllers/parameter";

const app: Application = express();
const route = Router();

const authDirectory = path.join (__dirname, '../.wwebjs_cache');

const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: [
    'https://cashback-front.up.railway.app',
    'http://localhost:4200'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}

const corsOptionsTwo = { origin: "*", credentials: true, optionsSuccessStatus: 200 }

// app.use(cors(corsOptions));
app.use(cors(corsOptionsTwo) );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
route.use('/sale', SaleRouter);
route.use('/whatsapp', WhatsappRouter);
route.use('/parameter', ParameterRouter);
app.use(route)

const server = http.createServer(app)
const io = new Server(server, {
  cors: corsOptionsTwo,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000 // 2 minutos
  }
});

export const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-client",
    dataPath: authDirectory
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ],
    timeout: 60000
  },
  // takeoverOnConflict: true
});

client.on('qr', (qr) => {
  console.log('QR Code recebido, enviando para o front...', qr);
  io.emit('qr', qr);
});

client.on('ready', () => {
  console.log('✅ WhatsApp está pronto para uso!');
  io.emit('ready', 'ready');
});

client.on("authenticated", () => {
  console.log("✅ Autenticado!");
});

client.on("disconnected", () => {
  console.log("🔴 Desconectado! Reiniciando...");
  client.initialize().then(_ => null)
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação", msg);
});

client.initialize()
  .then(() => console.log('🚀 Cliente WhatsApp iniciado com sucesso!'))
  .catch((error) => console.error('❌ Erro ao iniciar o cliente:', error))

server.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${ process.env.PORT }`);
});