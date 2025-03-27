import { WhatsappRouter } from "./controllers/whatsapp";
import { SaleRouter } from "./controllers/sale";
import { ParameterRouter } from "./controllers/parameter";

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

import { Client, RemoteAuth } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import { Server } from 'socket.io';
import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';

// Configurações
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://fbzpanatto:fnp181292@cluster0.1quv5d8.mongodb.net/whatsapp?retryWrites=true&w=majority&appName=Cluster0";
const PORT = process.env.PORT || 3000;

// Inicializações
const app: Application = express();
const server = http.createServer(app);

// Configuração CORS
const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin: [
    'https://cashback-front.up.railway.app',
    'http://localhost:4200'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO
const io = new Server(server, {
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000
  }
});

// Conexão MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB');
    await initializeWhatsAppClient()
  })
  .catch(err => console.error('❌ Erro MongoDB:', err));

// WhatsApp Client
export let whatsappClient: Client | null = null;

async function initializeWhatsAppClient() {

  const store = new MongoStore({ mongoose: mongoose }),

  whatsappClient = new Client({
    authStrategy: new RemoteAuth({
      clientId: "whatsapp-client",
      store: store,
      backupSyncIntervalMs: 300000
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      timeout: 60000
    }
  });

  // Event handlers
  whatsappClient.on('qr', (qr) => {
    console.log('QR Code recebido', qr);
    io.emit('qr', qr);
  });

  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp pronto');
    io.emit('ready', { status: 'ready' });
  });

  whatsappClient.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso');
  });

  whatsappClient.on('remote_session_saved', () => {
    console.log('remote_session_saved')
  })

  whatsappClient.on('disconnected', (reason) => {
    console.log(`🔴 Desconectado: ${reason}`);
    io.emit('disconnected', { reason });
    setTimeout(() => initializeWhatsAppClient(), 5000);
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    io.emit('auth_failure', { error: msg });
  });

  try {
    await whatsappClient.initialize();
    console.log('🚀 Cliente WhatsApp iniciado');
  } catch (error) {
    console.error('❌ Erro ao iniciar cliente:', error);
  }
}

// Rotas
app.use('/whatsapp', WhatsappRouter);
app.use('/sale', SaleRouter);
app.use('/parameter', ParameterRouter);

// Inicia servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando aplicação...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  await mongoose.disconnect();
  server.close();
  process.exit(0);
});