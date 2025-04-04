import { databaseConnection } from "./connection";
import { clientsTotalCashback, createMessageLog, getMessage, nextCashbackExpiration } from "./queries";
import { whatsappClient } from "../index";

export const checkCashback = async () => {

  let conn = await databaseConnection.getConnection();

  try {

    const closeToExpiration = await nextCashbackExpiration(conn)

    if (closeToExpiration.length > 0) {

      if (!whatsappClient?.info?.wid) {
        console.log('❌ WhatsApp não está conectado');
        return;
      }

      const message = await getMessage(conn);

      for(let client of closeToExpiration) {

        let phone = client.phone.replace(/\D/g, '')

        if (phone.length < 10 || phone.length > 11) { continue }

        if (!phone.startsWith('55')) { phone = `55${ phone }` }

        const chatId = `${ phone }@c.us`;

        const el = await clientsTotalCashback(conn, client.client_id);

        const replaced = message.text
          .replace('[NN]', client.name)
          .replace('[TT]', String(el.amount))
          .replace('[EE]', String(client.next_cashback))
          .replace('[DD]', String(client.days_until_expiration))

        const isRegistered = await whatsappClient?.isRegisteredUser(chatId);

        if (isRegistered) {

          console.log('Registered: ', isRegistered);
          console.log(`📞 Disparando para ${ chatId }`);
          console.log('📨 Mensagem:', replaced);

          await createMessageLog(conn, { client_id: client.client_id, text: replaced });
          await whatsappClient?.sendMessage(chatId, replaced);
          await new Promise(resolve => setTimeout(resolve, 3000))
        } else { console.log(`⚠️ Número ${chatId} não é um usuário registrado`) }
      }
    }
  }

  catch (error) { console.log('checkCashback', error) }
  finally { conn.release() }
}