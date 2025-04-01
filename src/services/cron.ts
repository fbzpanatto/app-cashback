import { databaseConnection } from "./connection";
import { createMessageLog, getMessage, getValidSales } from "./queries";
import { whatsappClient } from "../index";

export const checkCashback = async () => {

  let conn = await databaseConnection.getConnection();

  try {

    const sales = await getValidSales(conn);

    if(sales && sales.length > 0) {

      const message = await getMessage(conn);

      for(let item of sales) {

        let phone = item.phone.replace(/\D/g, '')

        if (phone.length < 10 || phone.length > 11) { continue }

        if (!phone.startsWith('55')) { phone = `55${phone}` }

        const chatId = `${phone}@c.us`;

        const replaced = message.text
          .replace('[NN]', item.name)
          .replace('[TT]', String(item.total_cashback))
          .replace('[EE]', String(item.next_expiring_cashback))
          .replace('[DD]', String(item.days_until_expiration))

        await whatsappClient?.sendMessage(chatId, replaced);
        await createMessageLog(conn, { client_id: item.client_id, text: replaced });

        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  catch (error) { console.log('checkCashback', error) }
  finally { conn.release() }
}