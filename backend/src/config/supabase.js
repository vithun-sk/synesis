import { createClient } from '@supabase/supabase-js';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

let supabaseClient = null;

if (config.isSupabaseConfigured()) {
  try {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    logger.info('Supabase client initialized with service role key');
  } catch (err) {
    logger.error('Failed to initialize Supabase client:', { error: err.message });
    supabaseClient = null;
  }
} else {
  logger.info('Supabase credentials not configured. Running in in-memory demo mode.');
}

/**
 * Checks database connectivity status
 * @returns {Promise<{ connected: boolean, mode: string, latency_ms?: number, error?: string }>}
 */
export async function checkDatabaseHealth() {
  if (!supabaseClient) {
    return {
      connected: false,
      mode: 'in-memory (demo mode)',
      message: 'Running in in-memory demo mode. Supabase credentials are not provided or incomplete.'
    };
  }

  const startTime = Date.now();
  try {
    const { error } = await supabaseClient
      .from('rooms')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        mode: 'supabase (error)',
        error: error.message
      };
    }

    const latencyMs = Date.now() - startTime;
    return {
      connected: true,
      mode: 'supabase (live)',
      latency_ms: latencyMs
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'supabase (unreachable)',
      error: err.message
    };
  }
}

export const supabase = supabaseClient;
export const isSupabaseEnabled = () => Boolean(supabaseClient);
export default supabaseClient;
