import { Request, Router } from "express";
import { databaseConnection } from "../services/connection";
import { getActions, updateAction } from "../services/queries";
import { Action } from "../interfaces/interfaces"

export const ActionRouter = Router();

ActionRouter.get("/", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {
    const data = await getActions(conn)
    return res.status(200).send({ status: 200, data })
  }
  catch (error: any) {
    console.log('ActionRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

ActionRouter.put("/", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  const { data } = req.body;
  try {

    await updateAction(conn, data as Action[])

    return res.status(200).json({ status: 204, message: 'Registro atualizado com sucesso.' });
  }
  catch (error: any) {
    console.log('ActionRouter.put', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})