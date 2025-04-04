import { databaseConnection } from "./connection";
import { clientsTotalCashback, createMessageLog, getMessage, nextCashbackExpiration } from "./queries";
import { whatsappClient } from "../index";

export const checkCashback = async () => {

  let conn = await databaseConnection.getConnection();

  try {

    const closeToExpiration = await nextCashbackExpiration(conn)

    console.log("closeToExpiration", closeToExpiration)

    if (closeToExpiration.length > 0) {

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

        console.log('Mensagem: ', replaced)

        await createMessageLog(conn, { client_id: client.client_id, text: replaced });
        await whatsappClient?.sendMessage(chatId, replaced);
      }
    }
  }

  catch (error) { console.log('checkCashback', error) }
  finally { conn.release() }
}