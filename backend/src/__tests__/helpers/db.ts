import mongoose from 'mongoose'

export async function connectTestDb(): Promise<void> {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI not set — ensure setup.ts ran first')
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  }
}

export async function clearTestDb(): Promise<void> {
  const { collections } = mongoose.connection
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect()
}
