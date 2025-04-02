import { databaseConnection } from "./connection";
import { clientsTotalCashback, createMessageLog, getMessage, nextCashbackExpiration } from "./queries";
import { whatsappClient } from "../index";

export const checkCashback = async () => {

  let conn = await databaseConnection.getConnection();

  try {

    const clients = await clientsTotalCashback(conn);

    if(clients && clients.length > 0) {

      const message = await getMessage(conn);

      for(let client of clients) {

        const next = (await nextCashbackExpiration(conn, client.client_id))[0]

        let phone = client.phone.replace(/\D/g, '')

        if (phone.length < 10 || phone.length > 11) { continue }

        if (!phone.startsWith('55')) { phone = `55${ phone }` }

        const chatId = `${ phone }@c.us`;

        if(next) {
          const replaced = message.text
            .replace('[NN]', client.name)
            .replace('[TT]', String(client.total_cashback))
            .replace('[EE]', String(next.total_cashback))
            .replace('[DD]', String(next.days_until_expiration))

          await whatsappClient?.sendMessage(chatId, replaced);
          await createMessageLog(conn, { client_id: client.client_id, text: replaced });
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }
  }

  catch (error) { console.log('checkCashback', error) }
  finally { conn.release() }
}