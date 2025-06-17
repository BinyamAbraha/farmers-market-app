import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfdhblstxjjnosdsziba.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZGhibHN0eGpqbm9zZHN6aWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzgxMjgsImV4cCI6MjA2NTc1NDEyOH0.2QSeH2orryYFGUBXzBeDzxbweY5zejcKvgLzv0iHMYY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);