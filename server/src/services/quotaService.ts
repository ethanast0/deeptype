import { logger } from '../utils/logger';

// In a real production app, this would be stored in a database
// For this demo, we'll use an in-memory store
const userQuotas: Record<string, { 
  used: number; 
  limit: number;
  resetDate: Date;
  tier: 'free' | 'pro';
}> = {};

/**
 * Initialize quota for a user
 * @param userId - Unique identifier for the user
 * @param tier - User's subscription tier
 */
export function initUserQuota(userId: string, tier: 'free' | 'pro' = 'free'): void {
  // Set monthly quota based on tier
  const limit = tier === 'pro' ? Infinity : 100;
  
  // Set reset date to first day of next month
  const now = new Date();
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  userQuotas[userId] = {
    used: 0,
    limit,
    resetDate,
    tier
  };
  
  logger.info(`Initialized quota for user ${userId}: ${limit} quotes (${tier} tier)`);
}

/**
 * Check if user has quota available
 * @param userId - Unique identifier for the user
 * @returns boolean indicating if user has quota available
 */
export function hasQuotaAvailable(userId: string): boolean {
  // If user doesn't exist in our records, initialize them
  if (!userQuotas[userId]) {
    initUserQuota(userId, 'free');
  }
  
  const quota = userQuotas[userId];
  
  // Reset quota if we're past the reset date
  const now = new Date();
  if (now > quota.resetDate) {
    logger.info(`Resetting quota for user ${userId}`);
    quota.used = 0;
    quota.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  
  // Pro users have unlimited quota
  if (quota.tier === 'pro') {
    return true;
  }
  
  return quota.used < quota.limit;
}

/**
 * Get current quota status for a user
 * @param userId - Unique identifier for the user
 * @returns Object containing quota information
 */
export function getQuotaStatus(userId: string): {
  used: number;
  limit: number;
  remaining: number;
  nextReset: Date;
  tier: 'free' | 'pro';
} {
  // If user doesn't exist in our records, initialize them
  if (!userQuotas[userId]) {
    initUserQuota(userId, 'free');
  }
  
  const quota = userQuotas[userId];
  
  return {
    used: quota.used,
    limit: quota.limit,
    remaining: quota.limit - quota.used,
    nextReset: quota.resetDate,
    tier: quota.tier
  };
}

/**
 * Increment quota usage for a user
 * @param userId - Unique identifier for the user
 * @param amount - Amount to increment by (default: 1)
 * @returns Updated quota information
 */
export function incrementQuotaUsage(userId: string, amount: number = 1): {
  used: number;
  limit: number;
  remaining: number;
} {
  // If user doesn't exist in our records, initialize them
  if (!userQuotas[userId]) {
    initUserQuota(userId, 'free');
  }
  
  const quota = userQuotas[userId];
  
  // Pro users have unlimited quota, but we still track usage
  quota.used += amount;
  
  logger.info(`User ${userId} quota usage: ${quota.used}/${quota.limit} (${quota.tier} tier)`);
  
  return {
    used: quota.used,
    limit: quota.limit,
    remaining: quota.limit - quota.used
  };
}

/**
 * Update user's subscription tier
 * @param userId - Unique identifier for the user
 * @param tier - New subscription tier
 */
export function updateUserTier(userId: string, tier: 'free' | 'pro'): void {
  // If user doesn't exist in our records, initialize them
  if (!userQuotas[userId]) {
    initUserQuota(userId, tier);
    return;
  }
  
  const oldTier = userQuotas[userId].tier;
  userQuotas[userId].tier = tier;
  
  // Update limit based on tier
  userQuotas[userId].limit = tier === 'pro' ? Infinity : 100;
  
  logger.info(`Updated user ${userId} from ${oldTier} to ${tier} tier`);
} 