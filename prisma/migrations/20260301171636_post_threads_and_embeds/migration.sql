-- AlterTable
ALTER TABLE "Post" ADD COLUMN "embedUrl" TEXT;

-- CreateTable
CREATE TABLE "PostReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentReplyId" TEXT,
    "content" TEXT NOT NULL,
    "embedUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostReply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "PostReply" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PostReply_postId_createdAt_idx" ON "PostReply"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PostReply_parentReplyId_idx" ON "PostReply"("parentReplyId");

-- CreateIndex
CREATE INDEX "PostReply_userId_idx" ON "PostReply"("userId");
