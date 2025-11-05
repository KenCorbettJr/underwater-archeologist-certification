/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "fal.media"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        port: "",
        pathname: "/api/storage/**",
      },
    ],
  },
};

module.exports = nextConfig;
