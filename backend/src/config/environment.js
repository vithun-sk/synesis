import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory or root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  campusTimezone: process.env.CAMPUS_TIMEZONE || 'Asia/Kolkata',
  tariffInrPerKwh: parseFloat(process.env.ELECTRICITY_TARIFF_INR_PER_KWH || '8'),
  supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim() : '',
  mlServiceUrl: process.env.ML_SERVICE_URL ? process.env.ML_SERVICE_URL.trim() : 'http://localhost:8000',

  // Utility to determine if Supabase credentials are configured
  isSupabaseConfigured() {
    return Boolean(
      this.supabaseUrl &&
      this.supabaseServiceRoleKey &&
      this.supabaseUrl.startsWith('http') &&
      !this.supabaseUrl.includes('example.com') &&
      this.supabaseServiceRoleKey.length > 20
    );
  }
};
