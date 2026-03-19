-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "needsAttention" BOOLEAN NOT NULL DEFAULT false;
