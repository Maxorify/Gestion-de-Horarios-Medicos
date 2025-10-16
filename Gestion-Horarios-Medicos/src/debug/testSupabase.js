import { supabase } from "@/services/supabaseClient";

async function testConn() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, rol, personas:persona_id(email)")
    .limit(1);

  console.log("// CODEx: Test de conexión a usuarios/personas", { data, error });
}

testConn();
