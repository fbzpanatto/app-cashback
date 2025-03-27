import { Request, Router } from "express";
import { databaseConnection } from "../services/connection";
import { getParameter, updateParameter } from "../services/queries";
import { Parameter } from "../interfaces/interfaces"

export const ParameterRouter = Router();

ParameterRouter.get("/", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {
    const data = await getParameter(conn)
    return res.status(200).send({ status: 200, data })
  }
  catch (error: any) {
    console.log('SaleRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})

ParameterRouter.put("/:id", async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  const { id } = req.params;
  try {

    await updateParameter(conn, Number(id), req.body as Parameter)

    return res.status(200).json({ status: 204, message: 'Registro atualizado com sucesso.' });
  }
  catch (error: any) {
    console.log('SaleRouter.get', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})