import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import {Action, Message, Parameter, Sale, User} from "../interfaces/interfaces";

interface PostInterface {
  clients: ResultSetHeader[],
  sales: ResultSetHeader[]
}

export async function getParameter(connection: PoolConnection) {
  const query = `
    SELECT p.id, p.cashback, p.expiration_day 
    FROM parameter AS p
  `
  const [result] = await connection.execute(query);
  return (result as Parameter[])[0];
}

export async function getMessage(connection: PoolConnection) {
  const query = `
    SELECT *
    FROM message
  `
  const [result] = await connection.execute(query);
  return (result as Message[])[0];
}

export async function getActions(connection: PoolConnection) {
  const query = `
    SELECT *
    FROM action
  `
  const [result] = await connection.execute(query);
  return (result as Action[]);
}

export async function getActiveActions(connection: PoolConnection) {
  const query = `
    SELECT *
    FROM action
    WHERE action.active = 1
  `
  const [result] = await connection.execute(query);
  return (result as Action[]);
}

export async function updateParameter(connection: PoolConnection, parameterId: number, parameter: Parameter) {

  const query = `
      UPDATE parameter
      SET cashback = ?, expiration_day = ?
      WHERE id = ?
  `;

  const [result] = await connection.execute(query, [parameter.cashback, parameter.expiration_day, parameterId]);
}

export async function updateMessage(connection: PoolConnection, messageId: number, message: Message) {

  const query = `
      UPDATE message
      SET text = ?
      WHERE id = ?
  `;

  const [result] = await connection.execute(query, [message.text, messageId]);
}

export async function updateAction(connection: PoolConnection, action: Action[]) {

  const query = `
      UPDATE action
      SET active = ?
      WHERE id = ?
  `;

  for(let item of action) {
    const [result] = await connection.execute(query, [item.active, item.id]);
  }
}

export async function getSales(connection: PoolConnection) {
  const query = `
    SELECT 
      s.id,
      s.client_id AS clientId,
      c.name AS clientName,
      c.phone AS clientPhone,
      s.sale_id AS saleId,
      s.sale_value AS saleValue,
      s.cashback AS cashback,
      DATE_FORMAT(s.sale_date, '%d/%m/%Y') AS saleDate,
      DATE_FORMAT(s.cashback_expiration, '%d/%m/%Y') AS cashbackExpiration,
      DATE_FORMAT(s.withdrawn_date, '%d/%m/%Y') AS withdrawnDate
    FROM sale AS s
    INNER JOIN client AS c ON s.client_id = c.id
    ORDER BY s.sale_date DESC
  `;

  const [result] = await connection.execute(query);
  return result as Sale[];
}

export async function getSalesByClientId(connection: PoolConnection, clientId: number) {
  const query = `
    SELECT 
      s.id,
      s.client_id AS clientId,
      c.name AS clientName,
      c.phone AS clientPhone,
      s.sale_id AS saleId,
      s.sale_value AS saleValue,
      s.cashback AS cashback,
      DATE_FORMAT(s.sale_date, '%d/%m/%Y') AS saleDate,
      DATE_FORMAT(s.cashback_expiration, '%d/%m/%Y') AS cashbackExpiration,
      DATE_FORMAT(s.withdrawn_date, '%d/%m/%Y') AS withdrawnDate
    FROM sale AS s
    INNER JOIN client AS c ON s.client_id = c.id
    WHERE s.client_id = ?
    ORDER BY s.sale_date DESC
  `;

  const [result] = await connection.execute(query, [clientId]);
  return result as Sale[];
}

export async function clientsTotalCashback(connection: PoolConnection, clientId: number) {
  const query = `
    SELECT
      s.client_id,
      c.name,
      c.phone,
      ROUND(SUM(s.sale_value * s.cashback), 2) AS total_cashback
    FROM sale s
    INNER JOIN client AS c ON s.client_id = c.id
    WHERE s.cashback_expiration >= CURDATE() AND s.withdrawn_date IS NULL AND s.client_id = ?
    GROUP BY s.client_id
  `

  const [result] = await connection.execute(query, [clientId]);
  return (result as { client_id: number, name: string, phone: string, total_cashback: number | string }[])[0];
}

export async function nextCashbackExpiration(connection: PoolConnection) {

  const query = `
      SELECT s.client_id,
             c.name,
             c.phone,
             s.cashback_expiration,
             ROUND((s.sale_value * s.cashback), 2)      AS next_cashback,
             DATEDIFF(s.cashback_expiration, CURDATE()) AS days_until_expiration
      FROM sale AS s
               INNER JOIN client AS c ON s.client_id = c.id
      WHERE s.cashback_expiration >= CURDATE()
        AND s.withdrawn_date IS NULL
        AND DATEDIFF(s.cashback_expiration, CURDATE()) IN (SELECT a.day FROM action AS a WHERE a.active = 1)
      order by s.cashback_expiration;
  `
  const [result] = await connection.execute(query);

  return result as { client_id: number, name: string, phone: string, cashback_expiration: number, next_cashback: number, days_until_expiration: number  }[];
}

export async function createMessageLog(connection: PoolConnection, log: { client_id: number, text: string }) {
  const query = `
    INSERT INTO message_log (client_id, text) VALUES (?, ?)
  `

  await connection.execute(query, [log.client_id, log.text]);
}

export async function updateSale(connection: PoolConnection, saleId: number, withdrawnDate: Date | string) {

  const query = `
    UPDATE sale SET sale.withdrawn_date = STR_TO_DATE(?, '%d/%m/%Y') WHERE sale.sale_id = ?
  `

  const [result] = await connection.execute(query, [withdrawnDate, saleId]);
}

export async function deleteSale(connection: PoolConnection, saleId: number) {

  const query = `
    DELETE FROM sale WHERE sale.sale_id = ?
  `

  const [result] = await connection.execute(query, [saleId]);
}

export async function importClientSales(connection: PoolConnection, data: Sale[]) {

  const clients = await importClients(connection, data)
  const sales = await importSales(connection, data)

  let results: PostInterface = { clients, sales }

  return results;
}

async function importClients(connection: PoolConnection, data: Sale[]) {

  const results = []

  const query = `INSERT IGNORE INTO client (phone, name) VALUES (?, ?)`;

  for(let item of data) {
    const [result] = await connection.execute(query, [item.clientPhone, item.clientName]);
    results.push(result)
  }

  return results as ResultSetHeader[];
}

async function importSales(connection: PoolConnection, data: Sale[]) {

  const results = []

  const selectQuery = `SELECT client.id, client.phone FROM client WHERE client.phone = ?`;

  const postQuery = `
    INSERT IGNORE INTO sale (client_id, sale_id, sale_value, cashback, sale_date, cashback_expiration) 
    VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%d/%m/%Y'), STR_TO_DATE(?, '%d/%m/%Y'))
  `;

  for(let item of data) {
    const [result] = await connection.execute(selectQuery, [item.clientPhone]);

    const client = (result as { id: number, phone: string }[])[0]

    if(client) {
      const [sale] = await connection.execute(postQuery, [client.id, item.saleId, item.saleValue, item.cashback, item.saleDate, item.cashbackExpiration]);
      results.push(sale)
    }
  }

  return results as ResultSetHeader[];
}

export async function getUserByEmail(connection: PoolConnection, email: string) {

  const query = `
    SELECT * FROM user WHERE user.email = ?;
  `
  const [result] = await connection.execute(query, [email]);

  return (result as User[])[0];
}