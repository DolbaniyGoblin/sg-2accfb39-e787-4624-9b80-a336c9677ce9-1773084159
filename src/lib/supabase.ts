import { createClient } from "@supabase/supabase-js";

const isBrowser = typeof window !== "undefined";

// Получаем значения из env
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Проверка на валидность URL и наличие ключей
// Если URL не начинается с http/https или содержит "your_supabase_url" (заглушка), считаем его невалидным
const isValidUrl = (url: string | undefined) => {
  return url && (url.startsWith("http://") || url.startsWith("https://")) && !url.includes("your_supabase_url");
};

// Если конфиг невалидный, используем безопасные заглушки, чтобы приложение не падало
if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.includes("your_supabase_anon_key")) {
  if (isBrowser) {
    console.warn(
      "%c⚠️ Supabase Config Missing or Invalid",
      "color: orange; font-size: 14px; font-weight: bold;",
      "\nUsing placeholder values to prevent crash. Please connect Supabase in project settings."
    );
  }
  // Используем валидный URL-заглушку, чтобы createClient не падал
  supabaseUrl = "https://placeholder.supabase.co";
  supabaseAnonKey = "placeholder-anon-key";
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);