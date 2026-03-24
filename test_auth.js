import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const email = 'geral@topconsultores.pt';
  const password = 'SuperPassword123!';
  
  // 1. Try to Login
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
        console.log("Account exists but wrong password. Attempting to Sign Up to see if it really exists...");
        const res = await supabase.auth.signUp({ email, password });
        console.log("Signup Result:", res.error ? res.error.message : "Success (Check Email)");
    } else {
        console.log("Login Error:", error.message);
    }
  } else {
    console.log("Login Success!", data.user.id);
    
    // Check role in profiles
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    console.log("Profile Data:", profile);
  }
}
main();
