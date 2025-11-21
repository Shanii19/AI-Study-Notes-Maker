/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SWC minify if you encounter SWC binary errors
  // Uncomment the line below if SWC errors persist:
  // swcMinify: false,
  // Body size limits are handled in API routes using NextRequest
  // No need for api.bodyParser in Next.js 14
}

module.exports = nextConfig

