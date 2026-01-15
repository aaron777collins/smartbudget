import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use the environment variable from .env
const prisma = new PrismaClient()

async function main() {
  const DEFAULT_USERNAME = 'aaron7c'
  const DEFAULT_PASSWORD = 'KingOfKings12345!'
  const DEFAULT_EMAIL = 'aaron@smartbudget.app'
  const DEFAULT_NAME = 'Aaron Collins'

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USERNAME },
    })

    if (existingUser) {
      console.log(`User "${DEFAULT_USERNAME}" already exists!`)
      console.log(`ID: ${existingUser.id}`)
      process.exit(0)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_USERNAME,
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        name: DEFAULT_NAME,
      },
    })

    console.log('✅ Default user created successfully!')
    console.log(`Username: ${user.username}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`ID: ${user.id}`)
    console.log('')
    console.log('Login credentials:')
    console.log(`  Username: ${DEFAULT_USERNAME}`)
    console.log(`  Password: ${DEFAULT_PASSWORD}`)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
