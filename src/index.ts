import { WhatsappRouter } from "./controllers/whatsapp";
import { SaleRouter } from "./controllers/sale";
import { ParameterRouter } from "./controllers/parameter";

require("dotenv").config();

import { Client, LocalAuth } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import express, { Application } from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import path from "node:path";

const PORT = 3000;

const app: Application = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*'
}

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

// WhatsApp Client
export let whatsappClient: Client | null = null;

async function initializeWhatsAppClient() {

  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      clientId: "id25",
      dataPath: path.join(__dirname, "../sessions"),
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--unhandled-rejections=strict"
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
app.get("/health", (req: Request, res: any) => {
  try {
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    return res.status(500).json({ status: 'error' });
  }
})

app.use('/whatsapp', WhatsappRouter);
app.use('/sale', SaleRouter);
app.use('/parameter', ParameterRouter);

const angularPath = path.join(__dirname, '../browser')
app.use(express.static(angularPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(angularPath, 'index.html'));
})

// Inicia servidor
server.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  await initializeWhatsAppClient()
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