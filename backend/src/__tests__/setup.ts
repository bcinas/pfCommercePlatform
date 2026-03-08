import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod: MongoMemoryServer

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!'
  mongod = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongod.getUri()
}, 60000)

afterAll(async () => {
  await mongod.stop()
}, 30000)
