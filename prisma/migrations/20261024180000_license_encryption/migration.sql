-- DropIndex
DROP INDEX "License_licenseKey_key";

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "encryptedKey" TEXT,
ADD COLUMN     "keyIv" TEXT,
ADD COLUMN     "keyTag" TEXT,
ADD COLUMN     "keyVersion" TEXT DEFAULT 'v1',
ALTER COLUMN "licenseKey" DROP NOT NULL,
ALTER COLUMN "maxActivations" SET DEFAULT 1;
