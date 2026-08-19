import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function testConnection() {
  try {
    // Test connection by counting users
    const userCount = await prisma.user.count()
    console.log(`��✅ Database connection successful! Found ${userCount} users.`)

    // Test creating a user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password-123'
      }
    })
    console.log(`��✅ Created test user: ${user.email}`)

    // Test finding the user
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    console.log(`��✅ Found user: ${foundUser?.name}`)

    // Clean up
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log(`��✅ Cleaned up test user`)

    await prisma.$disconnect()
    console.log('��✅ All tests passed!')
  } catch (error) {
    console.error('��❌ Database connection failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testConnection()