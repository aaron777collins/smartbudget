/**
 * Background Job Queue System
 *
 * Simple job queue for processing long-running tasks in the background.
 * Uses database for persistence and in-memory processing.
 */

import { prisma } from '@/lib/prisma';
import { researchMerchantsBatch } from '@/lib/merchant-researcher';
import { Prisma } from '@prisma/client';

/**
 * Job types
 */
export enum JobType {
  MERCHANT_RESEARCH_BATCH = 'MERCHANT_RESEARCH_BATCH',
  TRANSACTION_CATEGORIZE_BATCH = 'TRANSACTION_CATEGORIZE_BATCH',
  IMPORT_TRANSACTIONS = 'IMPORT_TRANSACTIONS',
}

/**
 * Job status
 */
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Job creation parameters
 */
export interface CreateJobParams<TPayload = unknown> {
  userId: string;
  type: JobType;
  payload: TPayload;
  total?: number;
}

/**
 * Job result
 */
export interface JobResult<TResult = unknown> {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  total?: number;
  processed: number;
  result?: TResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new background job
 */
export async function createJob<TPayload = unknown>(params: CreateJobParams<TPayload>): Promise<JobResult> {
  const job = await prisma.job.create({
    data: {
      userId: params.userId,
      type: params.type,
      payload: params.payload as Prisma.InputJsonValue,
      total: params.total,
      status: JobStatus.PENDING,
      progress: 0,
      processed: 0,
    },
  });

  return formatJobResult(job);
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string, userId: string): Promise<JobResult | null> {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: userId,
    },
  });

  if (!job) {
    return null;
  }

  return formatJobResult(job);
}

/**
 * List jobs for a user
 */
export async function listJobs(
  userId: string,
  options?: {
    status?: JobStatus;
    type?: JobType;
    limit?: number;
    offset?: number;
  }
): Promise<{ jobs: JobResult[]; total: number }> {
  const where: Prisma.JobWhereInput = { userId };

  if (options?.status) {
    where.status = options.status;
  }

  if (options?.type) {
    where.type = options.type;
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs: jobs.map(formatJobResult),
    total,
  };
}

/**
 * Update job progress
 */
export async function updateJobProgress(
  jobId: string,
  processed: number,
  total?: number
): Promise<void> {
  const progress = total ? Math.floor((processed / total) * 100) : 0;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      processed,
      total: total || undefined,
      progress,
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark job as started
 */
export async function markJobStarted(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark job as completed
 */
export async function markJobCompleted<TResult = unknown>(jobId: string, result: TResult): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      result: result as Prisma.InputJsonValue,
      progress: 100,
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark job as failed
 */
export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.FAILED,
      error,
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string, userId: string): Promise<boolean> {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId: userId,
      status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
    },
  });

  if (!job) {
    return false;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.CANCELLED,
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return true;
}

/**
 * Process a job (main worker function)
 */
export async function processJob(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    console.error(`Job not found: ${jobId}`);
    return;
  }

  if (job.status !== JobStatus.PENDING) {
    console.log(`Job ${jobId} is not pending (status: ${job.status}), skipping`);
    return;
  }

  try {
    // Mark as started
    await markJobStarted(jobId);

    // Process based on job type
    switch (job.type) {
      case JobType.MERCHANT_RESEARCH_BATCH:
        await processMerchantResearchBatch(job);
        break;

      case JobType.TRANSACTION_CATEGORIZE_BATCH:
        // TODO: Implement when needed
        throw new Error('TRANSACTION_CATEGORIZE_BATCH not yet implemented');

      case JobType.IMPORT_TRANSACTIONS:
        // TODO: Implement when needed
        throw new Error('IMPORT_TRANSACTIONS not yet implemented');

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await markJobFailed(
      jobId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

interface MerchantResearchPayload {
  merchants: Array<{ merchantName: string; amount?: number; date?: string }>;
  saveToKnowledgeBase?: boolean;
}

interface MerchantResearchResult {
  merchantName: string;
  businessName?: string;
  businessType?: string;
  categorySlug?: string;
  confidence: number;
  reasoning?: string;
  sources?: string[];
  website?: string;
  location?: string;
  error?: string;
}

/**
 * Process merchant research batch job
 */
async function processMerchantResearchBatch(job: { id: string; payload: Prisma.JsonValue }): Promise<void> {
  const payload = job.payload as unknown as MerchantResearchPayload;

  const merchants = payload.merchants.map((m) => ({
    merchantName: m.merchantName,
    amount: m.amount,
    date: m.date ? new Date(m.date) : undefined,
  }));

  const total = merchants.length;
  const batchSize = 3; // Process 3 at a time
  const results: MerchantResearchResult[] = [];

  // Process in batches
  for (let i = 0; i < merchants.length; i += batchSize) {
    const batch = merchants.slice(i, i + batchSize);
    const batchResults = await researchMerchantsBatch(batch, batchSize);
    results.push(...batchResults);

    // Update progress
    await updateJobProgress(job.id, results.length, total);

    // Small delay between batches
    if (i + batchSize < merchants.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Save to knowledge base if requested
  if (payload.saveToKnowledgeBase !== false) {
    await saveBatchToKnowledgeBase(results);
  }

  // Mark as completed
  await markJobCompleted(job.id, {
    total: results.length,
    successful: results.filter((r) => r.categorySlug && r.confidence >= 0.7).length,
    failed: results.filter((r) => r.error || !r.categorySlug).length,
    results: results,
  });
}

/**
 * Save batch results to knowledge base
 */
async function saveBatchToKnowledgeBase(results: MerchantResearchResult[]): Promise<void> {
  // Filter successful results (confidence >= 0.7)
  const successfulResults = results.filter(
    (r) => r.categorySlug && r.confidence >= 0.7
  );

  // Save each result
  for (const result of successfulResults) {
    try {
      // Find category by slug
      const category = await prisma.category.findUnique({
        where: { slug: result.categorySlug },
      });

      if (!category) {
        console.warn(`Category not found for slug: ${result.categorySlug}`);
        continue;
      }

      // Create or update merchant knowledge entry
      await prisma.merchantKnowledge.upsert({
        where: { merchantName: result.merchantName },
        create: {
          merchantName: result.merchantName,
          normalizedName: result.businessName || result.merchantName,
          categoryId: category.id,
          confidenceScore: result.confidence,
          source: 'claude_ai',
          metadata: {
            businessType: result.businessType,
            reasoning: result.reasoning,
            sources: result.sources,
            website: result.website,
            location: result.location,
            researchedAt: new Date().toISOString(),
          },
        },
        update: {
          normalizedName: result.businessName || result.merchantName,
          categoryId: category.id,
          confidenceScore: result.confidence,
          source: 'claude_ai',
          metadata: {
            businessType: result.businessType,
            reasoning: result.reasoning,
            sources: result.sources,
            website: result.website,
            location: result.location,
            researchedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to save merchant ${result.merchantName}:`, error);
      // Continue with other merchants
    }
  }

  console.log(
    `Saved ${successfulResults.length}/${results.length} merchant research results to knowledge base`
  );
}

/**
 * Format job for API response
 */
function formatJobResult(job: {
  id: string;
  type: string;
  status: string;
  progress: number;
  total: number | null;
  processed: number;
  result: Prisma.JsonValue;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): JobResult {
  return {
    id: job.id,
    type: job.type as JobType,
    status: job.status as JobStatus,
    progress: job.progress,
    total: job.total ?? undefined,
    processed: job.processed,
    result: job.result as unknown,
    error: job.error ?? undefined,
    startedAt: job.startedAt ?? undefined,
    completedAt: job.completedAt ?? undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Process pending jobs (call this periodically)
 */
export async function processPendingJobs(limit: number = 5): Promise<void> {
  const pendingJobs = await prisma.job.findMany({
    where: { status: JobStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  console.log(`Processing ${pendingJobs.length} pending jobs`);

  // Process jobs sequentially to avoid overwhelming the system
  for (const job of pendingJobs) {
    await processJob(job.id);
  }
}
