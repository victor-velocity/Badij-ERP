// updateRole.js

import { createClient } from "@supabase/supabase-js";

// ---- CONFIGURE THESE ----
const SUPABASE_URL = "https://ygbezrhpwjlimnmfnrhe.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnYmV6cmhwd2psaW1ubWZucmhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgxNDA3NSwiZXhwIjoyMDgwMzkwMDc1fQ.dNfQGXx061ROBA2kt7Wy0n_Cg-PYhf2_SA2kAo8ZC8s";
const USER_ID = "b7ef7912-f081-4300-afbf-6330a6366403";
const NEW_ROLE = "user";
// --------------------------

async function updateUserRole() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log("Updating user role...");

  const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
    app_metadata: {
      role: NEW_ROLE,
    },
  });

  if (error) {
    console.error("Failed to update role:", error);
    return;
  }

  console.log("Role successfully updated!");
  console.log(JSON.stringify(data, null, 2));
}

updateUserRole();
