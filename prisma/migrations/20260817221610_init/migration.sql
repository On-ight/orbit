-- CreateTable
CREATE TABLE "MockMention" (
    "id" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MockMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "sourceMentionId" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "intent" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "potentialCustomer" BOOLEAN NOT NULL DEFAULT false,
    "riskTier" TEXT NOT NULL,
    "matchedKeywords" TEXT,
    "aiRiskReasoning" TEXT,
    "aiDraftReply" TEXT,
    "recommendedAction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'X',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "platformPostId" TEXT,
    "publishedUrl" TEXT,
    "sourceTrendId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "platform" TEXT NOT NULL DEFAULT 'X',
    "content" TEXT NOT NULL,
    "editedContent" TEXT,
    "aiReasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "riskTier" TEXT NOT NULL,
    "conversationId" TEXT,
    "postId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "summary" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newFollowers" INTEGER NOT NULL,
    "waitlistSignups" INTEGER NOT NULL,
    "isDemoData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendInput" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "rawSignal" TEXT NOT NULL,
    "summary" TEXT,
    "riskTier" TEXT,
    "matchedKeywords" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendInput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_sourceMentionId_key" ON "Conversation"("sourceMentionId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_intent_idx" ON "Conversation"("intent");

-- CreateIndex
CREATE INDEX "Conversation_riskTier_idx" ON "Conversation"("riskTier");

-- CreateIndex
CREATE INDEX "Post_status_idx" ON "Post"("status");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailySnapshot_date_key" ON "DailySnapshot"("date");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sourceMentionId_fkey" FOREIGN KEY ("sourceMentionId") REFERENCES "MockMention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_sourceTrendId_fkey" FOREIGN KEY ("sourceTrendId") REFERENCES "TrendInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
