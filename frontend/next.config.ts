import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent your app being embedded in iframes on other sites (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from guessing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to external sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable access to camera / microphone / location
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
