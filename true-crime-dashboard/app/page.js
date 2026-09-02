import { supabase } from "@/lib/supabaseClient";
import CasesTable from "@/components/CasesTable";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("incident_date", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <h1 className="text-lg font-semibold text-neutral-100 mb-2">
          No se pudo conectar a Supabase
        </h1>
        <p className="text-sm text-neutral-500">{error.message}</p>
        <p className="text-xs text-neutral-600 mt-4">
          Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu .env.local,
          y que hayas corrido supabase/schema.sql en tu proyecto.
        </p>
      </div>
    );
  }

  return <CasesTable initialCases={data || []} />;
}
