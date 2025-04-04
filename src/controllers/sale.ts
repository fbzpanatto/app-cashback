import { Request, Router } from "express";
import { databaseConnection } from "../services/connection";
import { Sale } from "../interfaces/interfaces";
import {deleteSale, getSales, getSalesByClientId, importClientSales, updateSale} from "../services/queries";

export const SaleRouter = Router();

SaleRouter.get('/', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {
    const data = await getSales(conn)
    return res.status(200).send({ status: 200, data })
  }
  catch (error: any) {
    console.log('SaleRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

SaleRouter.get('/:id', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();

  const { id } = req.params;

  try {
    const data = await getSalesByClientId(conn, Number(id))
    return res.status(200).send({ status: 200, data })
  }
  catch (error: any) {
    console.log('SaleRouter.get:id', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

SaleRouter.post('/', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {
    const result = await importClientSales(conn, (req.body as Sale[]))
    const clients = result.clients.reduce((acc, prev) => (acc += prev.affectedRows), 0)
    const sales = result.sales.reduce((acc, prev) => (acc += prev.affectedRows), 0)
    return res.status(201).json({ status: 201, message: `Clientes importados: ${ clients }. Vendas importadas: ${ sales }` });
  }
  catch (error: any) {
    console.log('SaleRouter.post', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

SaleRouter.put('/:saleId', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  const { saleId } = req.params;
  const { withdrawnDate } = req.body;

  try {
    await updateSale(conn, Number(saleId), withdrawnDate)
    return res.status(200).json({ status: 204, message: 'Registro atualizado com sucesso.' });
  }
  catch (error: any) {
    console.log('SaleRouter.put', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

SaleRouter.delete('/:saleId', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();

  const { saleId } = req.params;

  try {
    await deleteSale(conn, Number(saleId))
    return res.status(200).json({ status: 200, message: 'Registro deletado com sucesso.' });
  }
  catch (error: any) {
    console.log('SaleRouter.delete', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})