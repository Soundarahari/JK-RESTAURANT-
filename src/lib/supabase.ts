import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables. Proceeding in mock mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://bhuyjcbsqatrruixpwao.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodXlqY2JzcWF0cnJ1aXhwd2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDY4NzIsImV4cCI6MjA5MDc4Mjg3Mn0.N0LKOM89FhOukpgFnn90q3gn1c_Xilsr3kNLtOthXow'
);
