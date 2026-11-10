/**
 * GET /api/sermons — sincronización con YouTube
 *
 * Devuelve los videos más recientes del canal (título, miniatura real,
 * fecha, URL) usando YouTube Data API v3. Si YOUTUBE_API_KEY no está
 * configurada, o la llamada falla, devuelve { videos: [] } — el sitio
 * usa el respaldo manual de content.js en ese caso, nunca se rompe.
 */

const YT = "https://www.googleapis.com/youtube/v3";
const DISPLAY_COUNT = 6;
// Cuántos videos recientes se revisan del canal antes de filtrar por título.
// Debe ser mayor que DISPLAY_COUNT porque videos que no matchean (devocionales,
// clips, etc.) se descartan antes de llegar a los DISPLAY_COUNT finales.
const FETCH_POOL = 50;
// Un servicio/prédica completo dura bastante más que un clip o un short.
// Se usa la duración real del video (no el título) para decidir qué mostrar,
// así no importa cómo se titule cada servicio (ej. "AMÓS — Escucha").
const MIN_MINUTES = Number(process.env.SERMONS_MIN_MINUTES || 20);

module.exports = async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const handle = process.env.YOUTUBE_HANDLE || "mundodefesd";
  // Solo se muestran videos cuyo título matchee este patrón — así no se
  // cuelan devocionales, clips u otro contenido que también se sube al canal.
  // Configurable sin tocar código: variable de entorno SERMONS_TITLE_FILTER
  // (ejemplo: "servicio dominical|prédica" para aceptar varios patrones).
  // Opcional: si se define SERMONS_TITLE_FILTER, además se exige que el título
  // matchee. Por defecto no se filtra por título (el filtro anterior,
  // "servicio dominical", escondía todo lo subido con otro nombre).
  const titleFilter = process.env.SERMONS_TITLE_FILTER;
  const titlePattern = titleFilter ? new RegExp(titleFilter, "i") : null;

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (!apiKey) {
    return res.status(200).json({ videos: [], error: "not_configured" });
  }

  try {
    const uploadsPlaylistId = await getUploadsPlaylistId(handle, apiKey);
    if (!uploadsPlaylistId) {
      return res.status(200).json({ videos: [], error: "channel_not_found" });
    }

    const videos = await getRecentVideos(uploadsPlaylistId, apiKey, titlePattern);
    return res.status(200).json({ videos });
  } catch (err) {
    console.error("sermons/sync:", err && err.message ? err.message : "error_desconocido");
    return res.status(200).json({ videos: [], error: "fetch_failed" });
  }
};

async function getUploadsPlaylistId(handle, apiKey) {
  const url = `${YT}/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`channels_lookup_failed_${r.status}`);
  const data = await r.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function getRecentVideos(playlistId, apiKey, titlePattern) {
  const url = `${YT}/playlistItems?part=snippet&maxResults=${FETCH_POOL}&playlistId=${playlistId}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`playlist_items_failed_${r.status}`);
  const data = await r.json();

  const items = (data.items || []).filter(
    (it) => it.snippet?.resourceId?.videoId && (!titlePattern || titlePattern.test(it.snippet.title || ""))
  );
  if (!items.length) return [];

  // Detalles reales: duración, fecha de la transmisión y estado (en vivo / programado).
  const ids = items.map((it) => it.snippet.resourceId.videoId).join(",");
  const vr = await fetch(`${YT}/videos?part=contentDetails,liveStreamingDetails,snippet,status&id=${ids}&key=${apiKey}`);
  if (!vr.ok) throw new Error(`videos_failed_${vr.status}`);
  const vdata = await vr.json();
  const byId = new Map((vdata.items || []).map((v) => [v.id, v]));

  return items
    .map((it) => ({ it, v: byId.get(it.snippet.resourceId.videoId) }))
    .filter(({ v }) =>
      v &&
      v.status?.privacyStatus === "public" &&
      v.snippet?.liveBroadcastContent === "none" && // fuera: en vivo ahora o programados
      isoMinutes(v.contentDetails?.duration) >= MIN_MINUTES
    )
    .map(({ it, v }) => {
      const s = v.snippet || it.snippet;
      const thumb =
        s.thumbnails?.maxres?.url ||
        s.thumbnails?.high?.url ||
        s.thumbnails?.medium?.url ||
        s.thumbnails?.default?.url ||
        null;
      return {
        id: v.id,
        title: s.title,
        // Fecha del servicio: inicio real de la transmisión si fue en vivo.
        publishedAt: v.liveStreamingDetails?.actualStartTime || s.publishedAt,
        thumbnail: thumb,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      };
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, DISPLAY_COUNT);
}

// "PT1H32M10S" -> 92.17
function isoMinutes(d) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d || "");
  if (!m) return 0;
  return (+m[1] || 0) * 60 + (+m[2] || 0) + (+m[3] || 0) / 60;
}
