import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.query.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { id: true, question: true, category: true, language: true, userId: true },
  })
  console.log(JSON.stringify(rows, null, 2))
}

main()
  .catch((e) => {
    console.error('Error:', e.message)
  })
  .finally(() => prisma.$disconnect())
