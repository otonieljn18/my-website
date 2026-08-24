# FORMADOS

Página de la serie de discipulado FORMADOS, dentro del sitio de Mundo de Fe Santo Domingo.
Vive en `/formados` (Vercel, mismo deploy que el resto del sitio — sin build step, HTML/CSS/JS plano).

## Estructura

```
formados/
  index.html          la página completa (10 secciones)
  tokens.css          paleta, tipografía, espaciado
  fonts.css           @font-face de Fraunces y Karla (autoalojadas)
  styles.css          estilos de todas las secciones + formulario
  fonts/               woff2 de Fraunces y Karla
  js/
    indice-semanas.js  scroll-reveal del índice (elemento firma)
    formulario.js       wizard de inscripción de 4 pasos
  img/                 hero.jpg/.webp, gen-kids.jpg/.webp, gen-adultos.jpg/.webp
                        (+ ancla-oracion.jpg/.webp, procesada pero sin usar todavía)
api/inscripcion.js      Vercel Function: valida, crea en SharePoint, notifica
```

## Desplegar

Nada especial: es parte del mismo proyecto Vercel que `mundodefesantodomingo.org`.
Al hacer push a la rama conectada, Vercel despliega `/formados` automáticamente.

Variables de entorno necesarias (Vercel → Settings → Environment Variables), ver `.env.example` en la raíz:
`FORMADOS_TENANT_ID`, `FORMADOS_CLIENT_ID`, `FORMADOS_CLIENT_SECRET`, `FORMADOS_SP_SITE_ID`,
`FORMADOS_SP_LIST_ID`, `FORMADOS_SENDER_MAILBOX`, `FORMADOS_LIDER_KIDS`, `FORMADOS_LIDER_NEXTGEN`, `FORMADOS_LIDER_ADULTOS`.

Sin esas variables, `/api/inscripcion` responde 502 en vez de escribir a SharePoint —
el formulario sigue siendo usable para probar la UI, pero no persiste nada.

## Pendiente de contenido real (no técnico)

- **Fotos documentales**: hero, Kids y Adultos ya tienen foto real (extraídas del OneDrive
  de la iglesia, `Multimedia/2026/Agosto/semana 3` y `semana 1`). Falta una de **Next Gen**
  (12–17) — esa card sigue solo con texto. Hay una foto extra procesada
  (`ancla-oracion.jpg`, hombre en oración) sin usar todavía, disponible para cuando se
  quiera ilustrar otra sección. Estas fotos son provisionales — se van a mejorar/reemplazar.
- **Los 9 títulos y descripciones del índice de semanas** son un borrador mío basado en
  el ancla de 2 Corintios 3:18 — revísalos antes de publicar, no son contenido oficial del ministerio.
- **Los 6 momentos de "cómo es una reunión"** también son borrador.
- **Lista real de sectores** en el selector del formulario (hoy tiene 4 de ejemplo + "Otro").
- **Hora y lugar** de las reuniones (hoy solo se menciona el jueves 3 de septiembre).
- **Respuesta de "¿Cuesta algo?"** en el FAQ — asumí que no cuesta nada, confírmalo.
- **Número de WhatsApp real** para el enlace de respaldo cuando falla el envío
  (`formados/js/formulario.js`, constante `WHATSAPP_FALLBACK`).
- Registro de la app en Entra ID + IDs de sitio/lista de SharePoint + correos de líderes.

## Diseño

Ver el `CLAUDE.md` original (guardado en `../../formados-web/CLAUDE.md`, fuera del sitio
desplegado) para el sistema de marca completo y las reglas de estética no negociables.
