import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.error('Supabase URL or Key missing', { url, key });
    throw new Error('Supabase configuration missing');
  }
  
  console.log('Creating Supabase client with URL:', url);
  const client = createBrowserClient(url, key);
  console.log('Supabase client created successfully');
  return client;
}