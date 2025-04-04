import { Request, Router } from "express";
import { databaseConnection } from "../services/connection";
import { getUserByEmail } from '../services/queries'
import { sign, verify, JwtPayload } from 'jsonwebtoken';

export const LoginRouter = Router();

LoginRouter.post('/', async (req: Request, res: any) => {
  let conn = await databaseConnection.getConnection();
  try {

    const { email, password } = req.body;

    const user = await getUserByEmail(conn, email)

    if (!user) { return res.status(401).send({ status: 401, error: "Credenciais Inválidas" } ) }

    const condition = user.password === password;

    if (!user || !condition) { return res.status(401).send({ status: 401, error: "Credenciais Inválidas" } ) }

    const payload = { user: user.id, email: user.email, admin: user.admin };

    const token = sign(payload, "SECRET", { expiresIn: 10800 })
    const decoded = verify(token, "SECRET") as JwtPayload;
    const expiresIn = decoded.exp;
    const admin = decoded.admin;

    return res.status(200).send({ status: 200, data: { token, expiresIn, admin } });

  }
  catch (error: any) {
    console.log('SaleRouter.post', error)
    res.status(500).json({ status: 500, error: error.message });
  }
  finally { conn.release() }
})