import { Database } from '@/types/supabase';
import { createClient } from '@supabase/supabase-js';
import { AIServiceType } from './index';

// Create a non-authenticated Supabase client for usage tracking
// This should only be used on server-side code with admin credentials
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Usage check result interface
 */
export interface UsageCheckResult {
  allowed: boolean;
  remainingQuota?: number;
  reason?: string;
}

/**
 * Checks if a user has enough quota for a specific AI service
 * 
 * @param userId The user ID to check quota for
 * @param serviceType The type of AI service (transcription, translation, summarization)
 * @param requestSize The size of the current request (seconds, characters, or count)
 * @returns Object indicating if the operation is allowed and remaining quota
 */
export async function checkUserQuota(
  userId: string,
  serviceType: AIServiceType,
  requestSize: number
): Promise<UsageCheckResult> {
  try {
    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        allowed: false,
        reason: 'Could not verify user subscription',
      };
    }
    
    const tier = profile.subscription_tier || 'free';
    
    // Get usage limits for the user's tier
    const { data: limits, error: limitsError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('plan', tier)
      .single();
    
    if (limitsError) {
      console.error('Error fetching usage limits:', limitsError);
      return {
        allowed: false,
        reason: 'Could not determine usage limits',
      };
    }
    
    // Get user's current usage
    const { data: usage, error: usageError } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      console.error('Error fetching usage:', usageError);
      return {
        allowed: false,
        reason: 'Could not determine current usage',
      };
    }
    
    const currentUsage = usage || {
      user_id: userId,
      transcription_seconds: 0,
      translation_characters: 0,
      summary_count: 0,
      last_reset: new Date().toISOString(),
    };
    
    // Check if the user has enough quota based on service type
    let allowed = false;
    let remainingQuota = 0;
    let limitField = '';
    let usageField = '';
    
    switch (serviceType) {
      case 'transcription':
        limitField = 'monthly_transcription_seconds';
        usageField = 'transcription_seconds';
        break;
      case 'translation':
        limitField = 'monthly_translation_characters';
        usageField = 'translation_characters';
        break;
      case 'summarization':
        limitField = 'monthly_summary_count';
        usageField = 'summary_count';
        break;
      default:
        return {
          allowed: false,
          reason: 'Unknown service type',
        };
    }
    
    const limit = limits[limitField];
    const currentAmount = currentUsage[usageField];
    remainingQuota = limit - currentAmount;
    
    // Check if the user has enough quota left
    if (remainingQuota >= requestSize) {
      allowed = true;
    } else {
      return {
        allowed: false,
        remainingQuota,
        reason: `You've reached your ${serviceType} limit for this billing period`,
      };
    }
    
    return {
      allowed,
      remainingQuota,
    };
  } catch (error) {
    console.error('Error checking user quota:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits',
    };
  }
}

/**
 * Updates a user's usage for a specific AI service
 * 
 * @param userId The user ID to update usage for
 * @param serviceType The type of AI service
 * @param amount The amount to add to the current usage
 * @returns True if the update was successful
 */
export async function updateUserUsage(
  userId: string,
  serviceType: AIServiceType,
  amount: number
): Promise<boolean> {
  try {
    // Determine which field to update based on service type
    let updateField = '';
    
    switch (serviceType) {
      case 'transcription':
        updateField = 'transcription_seconds';
        break;
      case 'translation':
        updateField = 'translation_characters';
        break;
      case 'summarization':
        updateField = 'summary_count';
        break;
      default:
        throw new Error('Unknown service type');
    }
    
    // Get the current usage value
    const { data: usage, error: fetchError } = await supabase
      .from('usage')
      .select(updateField)
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current usage:', fetchError);
      return false;
    }
    
    const currentValue = usage ? (usage[updateField as keyof typeof usage] as number) || 0 : 0;
    const newValue = currentValue + amount;
    
    // Update the usage record
    const { error: updateError } = await supabase
      .from('usage')
      .upsert({
        user_id: userId,
        [updateField]: newValue,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    if (updateError) {
      console.error('Error updating usage:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user usage:', error);
    return false;
  }
} 