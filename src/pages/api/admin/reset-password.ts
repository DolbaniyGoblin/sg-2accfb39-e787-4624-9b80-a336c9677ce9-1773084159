import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, newPassword, adminSecret } = req.body;

  // Простая защита - секретный ключ для доступа к этому endpoint
  if (adminSecret !== process.env.ADMIN_RESET_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and newPassword are required" });
  }

  try {
    // Создаём Supabase Admin Client с service_role ключом
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Получаем пользователя по email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Сбрасываем пароль через Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: `Password updated successfully for ${email}`
    });

  } catch (error: any) {
    console.error("Password reset error:", error);
    return res.status(500).json({
      error: error.message || "Failed to reset password"
    });
  }
}