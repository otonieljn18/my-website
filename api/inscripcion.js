/**
 * POST /api/inscripcion — FORMADOS
 *
 * Recibe la inscripción del formulario, la valida del lado servidor,
 * crea un elemento de SharePoint por persona (Microsoft Graph REST,
 * client credentials) y envía confirmación + aviso al líder de pista.
 *
 * Nunca confía en la validación del cliente. Nunca registra datos de
 * menores en logs, nunca los pone en URLs, nunca responde con detalle
 * interno de error.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let payload;
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: "invalid_json" });
  }

  const errors = validate(payload);
  if (errors.length) {
    return res.status(400).json({ ok: false, error: "invalid_payload" });
  }

  const familiaId = crypto.randomUUID();
  const { responsable, personas, interesFacilitar, nota, autorizaTutor, autorizaFotos } = payload;

  try {
    const token = await getGraphToken();

    // Un elemento de SharePoint por persona, todos comparten FamiliaID.
    for (const persona of personas) {
      await crearElementoSharePoint(token, {
        FamiliaID: familiaId,
        Nombre: persona.nombre,
        Edad: persona.edad,
        Pista: persona.pista,
        EsResponsable: !!persona.principal,
        Retira: persona.retira || "",
        Alergias: persona.alergias || "",
        ResponsableNombre: responsable.nombre,
        ResponsableWhatsapp: responsable.whatsapp,
        ResponsableCorreo: responsable.correo,
        Sector: responsable.sector,
        PrimeraVez: responsable.primeraVez,
        InteresFacilitar: interesFacilitar,
        Nota: nota || "",
        AutorizaTutor: autorizaTutor,
        AutorizaFotos: autorizaFotos,
        EnviadoEn: payload.enviadoEn,
        Origen: payload.origen || "web"
      });
    }

    await enviarConfirmacion(token, responsable, personas).catch(logSinDatosSensibles);
    await notificarLideres(token, personas).catch(logSinDatosSensibles);

    return res.status(201).json({ ok: true });
  } catch (err) {
    logSinDatosSensibles(err);
    return res.status(502).json({ ok: false, error: "no_se_pudo_procesar" });
  }
};

/* ── Validación server-side ── */
function validate(p) {
  const errors = [];
  if (!p || typeof p !== "object") return ["payload"];

  const r = p.responsable;
  if (!r || typeof r.nombre !== "string" || r.nombre.trim().length < 3) errors.push("responsable.nombre");
  if (!r || !/^[0-9+()\s-]{10,}$/.test(String(r.whatsapp || ""))) errors.push("responsable.whatsapp");
  if (!r || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(r.correo || ""))) errors.push("responsable.correo");
  if (!r || !r.sector) errors.push("responsable.sector");
  if (!r || !["Sí", "No"].includes(r.primeraVez)) errors.push("responsable.primeraVez");

  if (!Array.isArray(p.personas) || p.personas.length === 0) errors.push("personas");
  else {
    for (const persona of p.personas) {
      if (typeof persona.nombre !== "string" || persona.nombre.trim().length < 3) errors.push("persona.nombre");
      if (typeof persona.edad !== "number" || persona.edad < 1 || persona.edad > 110) errors.push("persona.edad");
      if (persona.edad < 18 && (!persona.retira || String(persona.retira).trim().length < 3)) errors.push("persona.retira");
    }
  }

  if (!["Sí", "Quizás", "No"].includes(p.interesFacilitar)) errors.push("interesFacilitar");

  const hayMenor = Array.isArray(p.personas) && p.personas.some((x) => x.edad < 18);
  if (hayMenor) {
    if (p.autorizaTutor !== true) errors.push("autorizaTutor");
    if (!["Sí", "No"].includes(p.autorizaFotos)) errors.push("autorizaFotos");
  }

  return errors;
}

/* ── Microsoft Graph: autenticación por client credentials ── */
async function getGraphToken() {
  const tenantId = process.env.FORMADOS_TENANT_ID;
  const clientId = process.env.FORMADOS_CLIENT_ID;
  const clientSecret = process.env.FORMADOS_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("config_incompleta");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const r = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!r.ok) throw new Error("graph_auth_failed");
  const data = await r.json();
  return data.access_token;
}

/* ── Crear elemento en la lista de SharePoint ── */
async function crearElementoSharePoint(token, fields) {
  const siteId = process.env.FORMADOS_SP_SITE_ID;
  const listId = process.env.FORMADOS_SP_LIST_ID;
  if (!siteId || !listId) throw new Error("config_incompleta");

  const r = await fetch(`${GRAPH}/sites/${siteId}/lists/${listId}/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
  if (!r.ok) throw new Error("sharepoint_create_failed");
  return r.json();
}

/* ── Correo de confirmación al responsable ── */
async function enviarConfirmacion(token, responsable, personas) {
  const sender = process.env.FORMADOS_SENDER_MAILBOX;
  if (!sender) return;

  const nombres = personas.map((p) => p.nombre.split(" ")[0]).join(", ");
  const mensaje = {
    message: {
      subject: "Tu inscripción a FORMADOS",
      body: {
        contentType: "Text",
        content:
          `Hola ${responsable.nombre.split(" ")[0]},\n\n` +
          `Confirmamos la inscripción de: ${nombres}.\n` +
          `Nos vemos el jueves 27 de agosto.\n\n— Mundo de Fe Santo Domingo`
      },
      toRecipients: [{ emailAddress: { address: responsable.correo } }]
    },
    saveToSentItems: false
  };

  const r = await fetch(`${GRAPH}/users/${sender}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(mensaje)
  });
  if (!r.ok) throw new Error("mail_confirmacion_failed");
}

/* ── Aviso a los líderes de pista ── */
async function notificarLideres(token, personas) {
  const sender = process.env.FORMADOS_SENDER_MAILBOX;
  const lideres = {
    Kids: process.env.FORMADOS_LIDER_KIDS,
    "Next Gen": process.env.FORMADOS_LIDER_NEXTGEN,
    Adultos: process.env.FORMADOS_LIDER_ADULTOS
  };
  if (!sender) return;

  const pistas = [...new Set(personas.map((p) => p.pista))];
  for (const pista of pistas) {
    const destinatario = lideres[pista];
    if (!destinatario) continue;
    const cantidad = personas.filter((p) => p.pista === pista).length;

    const mensaje = {
      message: {
        subject: `Nueva inscripción en ${pista} — FORMADOS`,
        body: { contentType: "Text", content: `Se inscribieron ${cantidad} persona(s) en la pista ${pista}.` },
        toRecipients: [{ emailAddress: { address: destinatario } }]
      },
      saveToSentItems: false
    };
    await fetch(`${GRAPH}/users/${sender}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(mensaje)
    });
  }
}

/* ── Logging sin datos sensibles ── */
function logSinDatosSensibles(err) {
  console.error("formados/inscripcion:", err && err.message ? err.message : "error_desconocido");
}
