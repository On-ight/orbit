import { ImageResponse } from "next/og";

const WIDTH = 1080;
const HEIGHT = 1350; // 4:5 — Instagram's current recommended carousel ratio

// Concrete hex values, not CSS custom properties — Satori (what
// ImageResponse renders through) doesn't resolve var(--accent) etc, it needs
// literal computed styles. Matches the dashboard's black/purple dark theme.
const BG_TOP = "#1a0b2e";
const BG_BOTTOM = "#0a0612";
const ACCENT = "#a855f7";
const TEXT_PRIMARY = "#f5f3ff";
const TEXT_MUTED = "#c4b5fd";
// Scrim behind the text when a photo is present — darkest at the bottom
// (where the headline/body/footer sit) fading up, so the top of the photo
// stays visible while every line of text stays legible over it.
const SCRIM = `linear-gradient(to top, rgba(10,6,18,0.94) 0%, rgba(10,6,18,0.78) 38%, rgba(10,6,18,0.35) 65%, rgba(10,6,18,0.05) 100%)`;

export interface CarouselSlide {
  headline: string;
  body: string;
}

export interface SlideImage {
  dataUri: string;
  photographerName: string;
}

/**
 * Renders each slide as a branded PNG via next/og's ImageResponse (Satori) —
 * synchronous, in-process, no external vendor for the rendering itself
 * (Unsplash sourcing happens separately, in lib/carousels/unsplash-client.ts,
 * before this is called). Runs inline inside the select-version route rather
 * than a background job, since this whole function typically finishes in
 * well under a second per slide. `images[i]` is null wherever no photo was
 * found — falls back to the plain gradient look for that slide rather than
 * failing the whole carousel over one missing image.
 */
export async function renderCarouselSlides(
  slides: CarouselSlide[],
  accountName: string,
  images: (SlideImage | null)[],
): Promise<Buffer[]> {
  return Promise.all(
    slides.map(async (slide, index) => {
      const image = images[index] ?? null;

      const response = new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              position: "relative",
              background: image ? "#0a0612" : `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
              fontFamily: "sans-serif",
            }}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.dataUri}
                alt=""
                width={WIDTH}
                height={HEIGHT}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            {image && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", background: SCRIM }} />
            )}

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "80px 72px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  fontWeight: 600,
                  color: ACCENT,
                  letterSpacing: 2,
                }}
              >
                {index + 1} / {slides.length}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 68,
                    fontWeight: 800,
                    color: TEXT_PRIMARY,
                    lineHeight: 1.15,
                  }}
                >
                  {slide.headline}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 34,
                    fontWeight: 400,
                    color: TEXT_MUTED,
                    lineHeight: 1.4,
                  }}
                >
                  {slide.body}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 500,
                    color: TEXT_MUTED,
                    opacity: 0.8,
                  }}
                >
                  {accountName}
                </div>
                {image && (
                  <div style={{ display: "flex", fontSize: 18, fontWeight: 400, color: TEXT_MUTED, opacity: 0.55 }}>
                    Photo by {image.photographerName} on Unsplash
                  </div>
                )}
              </div>
            </div>
          </div>
        ),
        { width: WIDTH, height: HEIGHT },
      );

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }),
  );
}
