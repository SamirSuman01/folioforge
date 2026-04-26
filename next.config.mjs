/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevents clickjacking — no embedding in iframes on other origins
          { key: 'X-Frame-Options',       value: 'DENY' },
          // Stops MIME-sniffing attacks — browser trusts declared content-type
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Leaks only origin (not full URL) when navigating off-site
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          // Camera/mic/location disabled — we don't need them
          { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
          // Speeds up asset pre-resolution
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
}

export default nextConfig
