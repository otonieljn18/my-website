#!/usr/bin/env node
/**
 * Aprovisiona la lista de SharePoint para FORMADOS de un solo golpe:
 * crea "Inscripciones FORMADOS" con las 18 columnas exactas que espera
 * api/inscripcion.js, y al final imprime el Site ID y List ID listos
 * para pegar en Vercel (FORMADOS_SP_SITE_ID / FORMADOS_SP_LIST_ID).
 *
 * Uso:
 *   1. Crea un archivo .env.provision (junto a este script o en la raíz
 *      del proyecto) con:
 *        FORMADOS_TENANT_ID=...
 *        FORMADOS_CLIENT_ID=...
 *        FORMADOS_CLIENT_SECRET=...
 *        SP_SITE_PATH=mundodefesantodomingo.sharepoint.com:/sites/Formados
 *      (SP_SITE_PATH es el sitio donde YA existe o creaste la lista —
 *      este script no crea sitios, solo la lista dentro de uno existente)
 *   2. node scripts/provision-formados-sharepoint.js
 *
 * No necesita npm install — solo usa fetch nativo de Node 18+.
 * .env.provision nunca se commitea (ver .gitignore) — bórralo cuando termines.
 */

const fs = require("fs");
const path = require("path");

loadDotEnv(path.join(__dirname, "..", ".env.provision"));
loadDotEnv(path.join(__dirname, ".env.provision"));

const LIST_NAME = "Inscripciones FORMADOS";

const COLUMNS = [
  { name: "FamiliaID", text: {} },
  { name: "Nombre", text: {} },
  { name: "Edad", number: { decimalPlaces: "none" } },
  { name: "Pista", text: {} },
  { name: "EsResponsable", boolean: {} },
  { name: "Retira", text: {} },
  { name: "Alergias", text: {} },
  { name: "ResponsableNombre", text: {} },
  { name: "ResponsableWhatsapp", text: {} },
  { name: "ResponsableCorreo", text: {} },
  { name: "Sector", text: {} },
  { name: "PrimeraVez", text: {} },
  { name: "InteresFacilitar", text: {} },
  { name: "Nota", text: { allowMultipleLines: true } },
  { name: "AutorizaTutor", boolean: {} },
  { name: "AutorizaFotos", text: {} },
  { name: "EnviadoEn", text: {} },
  { name: "Origen", text: {} },
];

async function main() {
  const tenantId = need("FORMADOS_TENANT_ID");
  const clientId = need("FORMADOS_CLIENT_ID");
  const clientSecret = need("FORMADOS_CLIENT_SECRET");
  const sitePath = need("SP_SITE_PATH");

  console.log("→ Autenticando con Microsoft Graph...");
  const token = await getToken(tenantId, clientId, clientSecret);
  console.log("  ok");

  console.log(`→ Buscando el sitio "${sitePath}"...`);
  const site = await graph(token, `/sites/${sitePath}`);
  console.log(`  Site ID: ${site.id}`);

  console.log(`→ Revisando si "${LIST_NAME}" ya existe...`);
  const existing = await graph(token, `/sites/${site.id}/lists`);
  let list = (existing.value || []).find((l) => l.displayName === LIST_NAME);

  if (list) {
    console.log(`  Ya existe (List ID: ${list.id}) — no se crea de nuevo.`);
  } else {
    console.log(`→ Creando "${LIST_NAME}" con ${COLUMNS.length} columnas...`);
    list = await graph(token, `/sites/${site.id}/lists`, "POST", {
      displayName: LIST_NAME,
      list: { template: "genericList" },
      columns: COLUMNS,
    });
    console.log(`  Creada (List ID: ${list.id})`);
  }

  console.log("\n✅ Listo. Pega esto en Vercel → Settings → Environment Variables:\n");
  console.log(`FORMADOS_SP_SITE_ID=${site.id}`);
  console.log(`FORMADOS_SP_LIST_ID=${list.id}`);
}

function need(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`Falta ${key}. Ponlo en .env.provision o expórtalo antes de correr el script.`);
    process.exit(1);
  }
  return v;
}

async function getToken(tenantId, clientId, clientSecret) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const r = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`No se pudo autenticar: ${data.error_description || data.error || r.status}`);
  }
  return data.access_token;
}

async function graph(token, urlPath, method = "GET", body) {
  const r = await fetch(`https://graph.microsoft.com/v1.0${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`Graph API error en ${urlPath}: ${data.error?.message || r.status}`);
  }
  return data;
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

main().catch((err) => {
  console.error("\n❌ " + err.message);
  process.exit(1);
});
