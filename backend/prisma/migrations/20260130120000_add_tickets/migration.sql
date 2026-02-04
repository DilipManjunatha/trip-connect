-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('TICKET', 'HOTEL', 'BILL', 'BOOKING', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('NONE', 'PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "type" "TicketType" NOT NULL DEFAULT 'TICKET',
    "filePath" TEXT,
    "fileName" TEXT,
    "ocrData" JSONB,
    "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "trip_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
