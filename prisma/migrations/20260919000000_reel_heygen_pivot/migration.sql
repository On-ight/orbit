-- AlterTable
ALTER TABLE "Reel" DROP COLUMN "voiceGender",
DROP COLUMN "voiceTone";

-- RenameColumn
ALTER TABLE "Reel" RENAME COLUMN "creatomateRenderId" TO "heygenVideoId";
