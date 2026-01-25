import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://supiwygxypfqjzoqmlaq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGl3eWd4eXBmcWp6b3FtbGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzI3ODUsImV4cCI6MjA4MjI0ODc4NX0.5dM_R53HJA3Q8YbBsqq7iDTiFxyQs33gtROnIJwfqAY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// NOTE:
// The generated Database typings can drift from the real schema in some projects.
// When that happens, `supabase.from("...")` can become typed as `never` and break the build.
// We keep runtime behavior the same but use `any` typings to keep the project compiling.
export const supabase = createClient<any>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});