import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = "https://kaciggprpbhrotniphcu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthY2lnZ3BycGJocm90bmlwaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTk2NjQsImV4cCI6MjA4NzY3NTY2NH0._rFTH7SE0ekdvbp266-4rNx4k4O1Dex1VohfrCXgSBU";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
