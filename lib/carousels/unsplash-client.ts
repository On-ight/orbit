const SEARCH_URL = "https://api.unsplash.com/search/photos";

export interface UnsplashImage {
  dataUri: string;
  photographerName: string;
}

/**
 * Finds one photo for a slide's imageQuery and returns it as a base64 data
 * URI (fetched and inlined here, not left as a remote URL) — ImageResponse's
 * own remote-fetch behavior during Satori rendering is less reliable than
 * fetching ourselves first. Returns null on any failure (no key configured,
 * no results, network error) — a missing background image is a degraded
 * carousel, not a broken one; slide-renderer.tsx falls back to the plain
 * gradient look when this comes back null.
 */
export async function searchUnsplashImage(query: string): Promise<UnsplashImage | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  try {
    const searchRes = await fetch(
      `${SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait&content_filter=high`,
      { headers: { Authorization: `Client-ID ${accessKey}` } },
    );
    if (!searchRes.ok) return null;

    const searchBody = await searchRes.json();
    const photo = searchBody?.results?.[0];
    const imageUrl = photo?.urls?.regular;
    if (!photo?.id || typeof imageUrl !== "string") return null;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;
    const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;

    // Required by Unsplash's API guidelines whenever a photo is actually
    // used (not just previewed) — a tracking hit, not a real file transfer.
    // Fire-and-await but never let a failure here block the render itself.
    const downloadLocation = photo?.links?.download_location;
    if (typeof downloadLocation === "string") {
      fetch(downloadLocation, { headers: { Authorization: `Client-ID ${accessKey}` } }).catch(() => {});
    }

    const photographerName = typeof photo?.user?.name === "string" ? photo.user.name : "Unsplash";
    return { dataUri, photographerName };
  } catch {
    return null;
  }
}
