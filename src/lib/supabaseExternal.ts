import { createClient } from '@supabase/supabase-js';

const EXTERNAL_URL = "https://hisethfmyvvkohauuluq.supabase.co";
const EXTERNAL_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpc2V0aGZteXZ2a29oYXV1bHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjI5ODIsImV4cCI6MjA4NDU5ODk4Mn0.Fxg2ol8VeUbqvUUKVIb3RmflHab8oUVn4pp88Wc21dk";

export const supabaseExternal = createClient(EXTERNAL_URL, EXTERNAL_ANON_KEY);
