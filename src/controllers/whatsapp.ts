import { Router, Request } from "express";
import { whatsappClient } from "../index";

export const WhatsappRouter = Router();

WhatsappRouter.post('/send-message', async (req: Request, res: any) => {
  let { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
  }

  try {

    // Remove caracteres não numéricos do número
    phone = phone.replace(/\D/g, '');

    // Verifica se o número tem o formato correto (10 ou 11 dígitos para Brasil)
    if (phone.length < 10 || phone.length > 11) {
      return res.status(400).json({ error: 'Número inválido. Deve conter DDD e telefone corretamente.' });
    }

    // Adiciona código do Brasil se necessário
    if (!phone.startsWith('55')) {
      phone = `55${phone}`;
    }

    // Adiciona sufixo "@c.us" exigido pelo WhatsApp Web.js
    const chatId = `${phone}@c.us`;

    await whatsappClient?.sendMessage(chatId, message);

    res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso!' });
  }
  catch (error: any) {
    console.log('WhatsappRouter.post: ', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
