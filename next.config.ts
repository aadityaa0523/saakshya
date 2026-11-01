import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A parent folder also has a lockfile, so name the real root
  outputFileTracingRoot: __dirname,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Permissions-Policy", value: "microphone=(self), camera=()" },
      ],
    }];
  },
};

export default nextConfig;
