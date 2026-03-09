import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSecret = process.env.ADMIN_RESET_SECRET;

    console.log("=== API Reset Password Debug ===");
    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);
    console.log("ADMIN_RESET_SECRET exists:", !!adminSecret);

    if (!supabaseUrl || !supabaseServiceKey || !adminSecret) {
      console.error("Missing environment variables!");
      return res.status(500).json({ 
        error: "Server configuration error",
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          hasSecret: !!adminSecret
        }
      });
    }

    const { email, newPassword, secretCode } = req.body;

    // Validate required fields
    if (!email || !newPassword || !secretCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify secret code
    if (secretCode !== adminSecret) {
      console.error("Invalid secret code provided");
      return res.status(403).json({ error: "Invalid secret code" });
    }

    // Create admin client with service role key
    console.log("Creating Supabase admin client...");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("Attempting to update user password for:", email);

    // Get user by email first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError || !userData) {
      console.error("Error listing users:", userError);
      return res.status(500).json({ error: "Failed to list users", details: userError?.message || "Unknown error" });
    }

    const user = userData.users.find((u: any) => u.email === email);
    
    if (!user) {
      console.error("User not found:", email);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Found user:", user.id);

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(500).json({ error: "Failed to update password", details: updateError.message });
    }

    console.log("Password updated successfully for user:", user.id);

    return res.status(200).json({ 
      success: true, 
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error("Unexpected error in reset-password API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}