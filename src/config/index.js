import dotenv from 'dotenv'
dotenv.config()

export default {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'secret'
}
