import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's auth module pulls in jwks-rsa, which bundles its own
  // ESM copy of `jose` — Turbopack's dev bundler chokes on that (ERR_REQUIRE_ESM)
  // when it tries to bundle the package. Marking it external makes Next
  // resolve it via Node's native require/import at runtime instead.
  serverExternalPackages: ["firebase-admin"],

  async redirects() {
    return [
      // The Instagram marketing page was removed — Instagram isn't
      // supported and there's no near-term launch to point visitors toward.
      { source: "/instagram-marketing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
