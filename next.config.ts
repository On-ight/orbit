import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's auth module pulls in jwks-rsa, which bundles its own
  // ESM copy of `jose` — Turbopack's dev bundler chokes on that (ERR_REQUIRE_ESM)
  // when it tries to bundle the package. Marking it external makes Next
  // resolve it via Node's native require/import at runtime instead.
  //
  // @ffmpeg-installer/ffmpeg resolves its platform-specific binary package
  // (e.g. @ffmpeg-installer/linux-x64) via a runtime require() the bundler
  // can't statically analyze — same "let Node's own require handle it"
  // fix. (sharp is already in Next's own built-in external-packages list,
  // so it doesn't need to be added here.)
  serverExternalPackages: ["firebase-admin", "@ffmpeg-installer/ffmpeg"],

  async redirects() {
    return [
      // The Instagram marketing page was removed — Instagram isn't
      // supported and there's no near-term launch to point visitors toward.
      { source: "/instagram-marketing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
