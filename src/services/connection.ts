import mysql from 'mysql2/promise';

class DatabaseConnection {
  private pool: mysql.Pool | null = null;

  // async getConnection(): Promise<mysql.PoolConnection> {
  //   if (!this.pool) {
  //     this.pool = mysql.createPool({
  //       host: process.env.DB_HOST,
  //       user: process.env.DB_USER,
  //       database: process.env.DB_NAME,
  //       password: process.env.DB_PASS,
  //       waitForConnections: true,
  //       connectionLimit: 10,   // Número de conexões na pool
  //       maxIdle: 10,            // Máximo de conexões ociosas
  //       idleTimeout: 60000,     // Timeout para conexões ociosas
  //       queueLimit: 0,          // Limite de consultas na fila
  //       enableKeepAlive: true,  // Habilita Keep-Alive
  //       keepAliveInitialDelay: 0, // Delay inicial de Keep-Alive
  //       dateStrings: true,      // Para retornar datas no formato de string
  //     });
  //   }
  //   return await this.pool.getConnection();
  // }

  // async getConnection(): Promise<mysql.PoolConnection> {
  //   if (!this.pool) {
  //     this.pool = mysql.createPool({
  //       host: process.env.MYSQLHOST,
  //       user: process.env.MYSQLUSER,
  //       database: process.env.MYSQLDATABASE,
  //       password: process.env.MYSQLPASSWORD,
  //       waitForConnections: true,
  //       connectionLimit: 10,   // Número de conexões na pool
  //       maxIdle: 10,            // Máximo de conexões ociosas
  //       idleTimeout: 60000,     // Timeout para conexões ociosas
  //       queueLimit: 0,          // Limite de consultas na fila
  //       enableKeepAlive: true,  // Habilita Keep-Alive
  //       keepAliveInitialDelay: 0, // Delay inicial de Keep-Alive
  //       dateStrings: true,      // Para retornar datas no formato de string
  //     });
  //   }
  //   return await this.pool.getConnection();
  // }

  async getConnection(): Promise<mysql.PoolConnection> {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: 'hopper.proxy.rlwy.net',
        user: 'root',
        database: 'app-cashback',
        password: 'HBwwqLXyObnyLAJVKbhyNsawjYHBiPWI',
        waitForConnections: true,
        connectionLimit: 10,   // Número de conexões na pool
        maxIdle: 10,            // Máximo de conexões ociosas
        idleTimeout: 60000,     // Timeout para conexões ociosas
        queueLimit: 0,          // Limite de consultas na fila
        enableKeepAlive: true,  // Habilita Keep-Alive
        keepAliveInitialDelay: 0, // Delay inicial de Keep-Alive
        dateStrings: true,      // Para retornar datas no formato de string
      });
    }
    return await this.pool.getConnection();
  }
}

export const databaseConnection = new DatabaseConnection();
