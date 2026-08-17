/**
 * GET /api/sermons — sincronización con YouTube
 *
 * Devuelve los videos más recientes del canal (título, miniatura real,
 * fecha, URL) usando YouTube Data API v3. Si YOUTUBE_API_KEY no está
 * configurada, o la llamada falla, devuelve { videos: [] } — el sitio
 * usa el respaldo manual de content.js en ese caso, nunca se rompe.
 */

const YT = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS = 6;

module.exports = async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const handle = process.env.YOUTUBE_HANDLE || "mundodefesd";

  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  if (!apiKey) {
    return res.status(200).json({ videos: [], error: "not_configured" });
  }

  try {
    const uploadsPlaylistId = await getUploadsPlaylistId(handle, apiKey);
    if (!uploadsPlaylistId) {
      return res.status(200).json({ videos: [], error: "channel_not_found" });
    }

    const videos = await getRecentVideos(uploadsPlaylistId, apiKey);
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

async function getRecentVideos(playlistId, apiKey) {
  const url = `${YT}/playlistItems?part=snippet&maxResults=${MAX_RESULTS}&playlistId=${playlistId}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`playlist_items_failed_${r.status}`);
  const data = await r.json();

  return (data.items || [])
    .filter((it) => it.snippet?.resourceId?.videoId)
    .map((it) => {
      const s = it.snippet;
      const thumb =
        s.thumbnails?.maxres?.url ||
        s.thumbnails?.high?.url ||
        s.thumbnails?.medium?.url ||
        s.thumbnails?.default?.url ||
        null;
      return {
        id: s.resourceId.videoId,
        title: s.title,
        publishedAt: s.publishedAt,
        thumbnail: thumb,
        url: `https://www.youtube.com/watch?v=${s.resourceId.videoId}`,
      };
    });
}
