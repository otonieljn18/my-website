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
  const { responsable, personas, nota, autorizaTutor, autorizaFotos } = payload;

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
        contentType: "HTML",
        content: confirmacionEmailHtml(responsable, nombres)
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
        body: { contentType: "HTML", content: liderEmailHtml(pista, cantidad) },
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

/* ── Plantillas de correo HTML ──
   Tabla + estilos inline a propósito: es lo único que renderiza bien
   en Outlook de escritorio. Fuentes web-safe (no las de la web pública,
   los clientes de correo no cargan @font-face de forma confiable). ── */

const BRAND = {
  dark: "#072A18",
  gold: "#B08A3E",
  goldLight: "#C9A45C",
  cream: "#F4F7E4",
  ink: "#1B2E22",
  gray: "#5C6B60",
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "Arial, Helvetica, sans-serif"
};

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function emailShell({ eyebrow, innerHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:${BRAND.sans};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${BRAND.dark};padding:32px 40px 28px;text-align:center;">
          <img src="https://www.mundodefesantodomingo.com/images/logo-icon-white.png" width="52" height="52" alt="Mundo de Fe Santo Domingo" style="display:inline-block;width:52px;height:52px;margin-bottom:14px;border:0;" />
          <div style="font-family:${BRAND.sans};font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:${BRAND.goldLight};margin-bottom:10px;">${escapeHtml(eyebrow)}</div>
          <div style="font-family:${BRAND.serif};font-size:32px;color:#ffffff;letter-spacing:0.02em;">FORMADOS</div>
          <div style="width:48px;height:2px;background:${BRAND.gold};margin:14px auto 0;"></div>
        </td></tr>
        <tr><td style="padding:36px 40px 8px;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-family:${BRAND.sans};font-size:12px;color:${BRAND.gray};line-height:1.6;">
            Mundo de Fe Santo Domingo — Más que una iglesia, somos familia<br/>
            Santo Domingo, República Dominicana
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr><td style="background:${BRAND.gold};border-radius:4px;">
      <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:${BRAND.sans};font-size:13px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

function confirmacionEmailHtml(responsable, nombres) {
  const primerNombre = escapeHtml(String(responsable.nombre).split(" ")[0]);
  const inner = `
    <p style="margin:0 0 18px;font-family:${BRAND.sans};font-size:16px;color:${BRAND.ink};">Hola ${primerNombre},</p>
    <p style="margin:0 0 24px;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.ink};">
      Confirmamos la inscripción de <strong>${escapeHtml(nombres)}</strong> a FORMADOS.
      Comenzamos el <strong>jueves 3 de septiembre</strong> — nueve semanas para responder juntos
      una sola pregunta: ¿en quién me estoy convirtiendo?
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      <tr><td style="background:${BRAND.cream};border-left:3px solid ${BRAND.gold};border-radius:4px;padding:22px 24px;">
        <p style="margin:0 0 12px;font-family:${BRAND.serif};font-style:italic;font-size:16px;line-height:1.6;color:${BRAND.ink};">
          "Nos alegra mucho que te sumes a FORMADOS. Estas nueve semanas no son un programa más —
          son un espacio para detenernos, mirar hacia adentro y dejar que Dios siga formando lo mejor
          de ti. No caminarás solo: vamos a estar cerca, orando por cada persona que se atrevió a decir
          que sí a esta pregunta."
        </p>
        <p style="margin:0;font-family:${BRAND.sans};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.gold};">— Pastores Otoniel y Jhanna</p>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-family:${BRAND.sans};font-size:13px;color:${BRAND.gray};">Nos vemos pronto.</p>
    ${ctaButton("Ver detalles de FORMADOS", "https://www.mundodefesantodomingo.com/formados")}
  `;
  return emailShell({ eyebrow: "Inscripción confirmada", innerHtml: inner });
}

function liderEmailHtml(pista, cantidad) {
  const listUrl = process.env.FORMADOS_SP_LIST_URL;
  const inner = `
    <p style="margin:0 0 18px;font-family:${BRAND.sans};font-size:16px;color:${BRAND.ink};">Hola,</p>
    <p style="margin:0 0 24px;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.ink};">
      Se ${cantidad === 1 ? "inscribió 1 persona nueva" : `inscribieron ${cantidad} personas nuevas`}
      en la pista <strong>${escapeHtml(pista)}</strong> de FORMADOS.
    </p>
    ${listUrl ? ctaButton("Ver en SharePoint", listUrl) : ""}
  `;
  return emailShell({ eyebrow: "Nueva inscripción", innerHtml: inner });
}

/* ── Logging sin datos sensibles ── */
function logSinDatosSensibles(err) {
  console.error("formados/inscripcion:", err && err.message ? err.message : "error_desconocido");
}
