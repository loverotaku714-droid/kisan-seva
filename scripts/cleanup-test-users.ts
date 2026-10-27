import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Keep Sunita Devi (9812345678) as the demo account; remove other test users
  const removed = await prisma.user.deleteMany({
    where: { phone: { in: ['9876543210', '9898989898'] } },
  })
  console.log(`Deleted ${removed.count} test users`)
  const users = await prisma.user.findMany({
    select: { name: true, phone: true, district: true, language: true },
  })
  console.log('Remaining users:', JSON.stringify(users))
}

main()
  .catch((e) => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect())
