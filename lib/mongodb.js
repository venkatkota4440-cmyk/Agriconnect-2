import { MongoClient } from 'mongodb'

// Reuse a single client across hot-reloads / requests
let clientPromise

if (!global._mongoClientPromise) {
  const client = new MongoClient(process.env.MONGO_URL)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export async function getDb() {
  const client = await clientPromise
  return client.db(process.env.DB_NAME || 'agrilink')
}

export default clientPromise
