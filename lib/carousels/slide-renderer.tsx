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

export interface CarouselSlide {
  headline: string;
  body: string;
}

/**
 * Renders each slide as a branded PNG via next/og's ImageResponse (Satori) —
 * synchronous, in-process, no external vendor. Runs inline inside the
 * select-version route rather than a background job, since this whole
 * function typically finishes in well under a second per slide.
 */
export async function renderCarouselSlides(slides: CarouselSlide[], accountName: string): Promise<Buffer[]> {
  return Promise.all(
    slides.map(async (slide, index) => {
      const response = new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "80px 72px",
              background: `linear-gradient(160deg, ${BG_TOP} 0%, ${BG_BOTTOM} 100%)`,
              fontFamily: "sans-serif",
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
          </div>
        ),
        { width: WIDTH, height: HEIGHT },
      );

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }),
  );
}
