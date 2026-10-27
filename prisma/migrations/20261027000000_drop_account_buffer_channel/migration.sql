-- DropForeignKey
ALTER TABLE "AccountBufferChannel" DROP CONSTRAINT IF EXISTS "AccountBufferChannel_accountId_fkey";

-- DropTable
DROP TABLE IF EXISTS "AccountBufferChannel";
