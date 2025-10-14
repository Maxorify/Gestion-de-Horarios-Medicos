import { supabase } from "@/services/supabaseClient";

async function testConn() {
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .limit(1);

  console.log("DATA:", data);
  console.log("ERROR:", error);
}

testConn();
