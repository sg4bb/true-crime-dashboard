# Case records — panel de casos true crime

Next.js 14 (App Router) + Supabase. Tabla de casos con tabs de estado, búsqueda,
orden por columna, rating por estrellas y visor de PDF del Incident Report.
Sin login por ahora (se agrega después).

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea una cuenta / inicia sesión.
2. "New project" — elige nombre, contraseña de base de datos y región.
3. Cuando termine de aprovisionar, ve a **SQL Editor** → New query, pega el
   contenido de `supabase/schema.sql` y dale Run.
4. (Opcional) Repite con `supabase/seed_example.sql` para tener 3 casos de prueba.
5. Ve a **Storage** → New bucket → nómbralo `incident-reports`. Puedes dejarlo
   privado (el código pide signed URLs automáticamente) o público.
6. Ve a **Project settings → API** y copia:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configurar el proyecto localmente

```bash
cp .env.local.example .env.local
# pega tus valores de Supabase en .env.local

npm install
npm run dev
```

Abre http://localhost:3000

## 3. Subir un PDF de prueba

En Supabase → Storage → `incident-reports`, sube un PDF cualquiera y anota su
`path` (ej. `2025-MM-402193-A-O.pdf`). Luego, en la tabla `cases`, edita la fila
correspondiente y pon ese path en la columna `pdf_path`. Al hacer clic en
"Ver PDF" en la app, debería cargar el archivo.

## 4. Desplegar

Recomendado: **Vercel** (es lo más simple para Next.js).

```bash
npm i -g vercel
vercel
```

Cuando te pida las variables de entorno, pon las mismas de tu `.env.local`.
También puedes seguir usando Railway como en tu proyecto de referencia —
solo asegúrate de definir `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` en las variables de entorno del servicio.

## Estructura

```
app/
  layout.js        layout raíz
  page.js           trae los casos desde Supabase (server component)
  globals.css       Tailwind
components/
  CasesTable.jsx    tabla, tabs, búsqueda, orden (client component)
  PdfModal.jsx       visor de PDF (signed URL o link directo)
  StatusPill.jsx
  Stars.jsx
lib/
  supabaseClient.js
supabase/
  schema.sql         tabla `cases` + políticas RLS
  seed_example.sql    datos de prueba opcionales
```

## Siguientes pasos (cuando quieras)

- Login con Supabase Auth (email/password o Google) y políticas RLS reales
  en vez de la lectura pública temporal
- Paginación server-side para cuando pases de unos cientos de casos
- Importador de CSV/XLSX directo a la tabla `cases`
- Columnas configurables (mostrar/ocultar) como en tu referencia
