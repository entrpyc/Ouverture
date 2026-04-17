-- AlterTable
ALTER TABLE "Task" ADD COLUMN "proposedPhases" JSONB;

-- AlterTable
ALTER TABLE "Phase" ADD COLUMN "proposedTickets" JSONB;
