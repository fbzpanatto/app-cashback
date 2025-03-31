import { Request, Router } from "express";
import { databaseConnection } from "../services/connection";
import { getMessage, updateMessage } from "../services/queries";
import { Message } from "../interfaces/interfaces"

export const MessageRouter = Router();

MessageRouter.get("/", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {
    const data = await getMessage(conn)
    return res.status(200).send({ status: 200, data })
  }
  catch (error: any) {
    console.log('MessageRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

MessageRouter.put("/:id", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  const { id } = req.params;
  try {

    await updateMessage(conn, Number(id), req.body as Message)

    return res.status(200).json({ status: 204, message: 'Registro atualizado com sucesso.' });
  }
  catch (error: any) {
    console.log('SaleRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})