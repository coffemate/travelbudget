const dotenv = require('dotenv');

dotenv.config();

const required = ['SUPABASE_DB_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  dbUrl: process.env.SUPABASE_DB_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
};
