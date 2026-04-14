import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    const expectedPassword = Deno.env.get("ADMIN_ACCESS_CREATION_PASSWORD");

    if (!expectedPassword) {
      return new Response(JSON.stringify({ valid: false, error: "Configuração ausente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providedPassword = typeof password === "string" ? password.trim() : "";
    const isValid = providedPassword.length > 0 && providedPassword === expectedPassword;

    return new Response(JSON.stringify({ valid: isValid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false, error: "Requisição inválida." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
