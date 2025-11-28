import { createClient, SupabaseClient } from '@supabase/supabase-js';

// NOTE: Ideally these are in process.env or import.meta.env. 
// For this demo, we check if they exist.
const supabaseUrl = 'https://fvzyeygfwgbqqgdbncig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2enlleWdmd2dicXFnZGJuY2lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDkyMDUsImV4cCI6MjA3OTEyNTIwNX0.C9gfXriw_Bi1sr_fYiNPXXvPuhyNqgfA2Wn48thHDxc';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase keys not found. Auth will run in MOCK mode.");
}

export { supabase };

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

// Helper function to convert Base64 to Blob
export const base64ToBlob = (base64: string): Blob | null => {
  try {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting base64 to blob", e);
    return null;
  }
};