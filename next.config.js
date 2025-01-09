/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Super permissive - allows all domains
        port: "",
        pathname: "**",
      },
    ],
    // Alternative approach - list specific domains
    domains: [
      "webtorrent.io",
      // Add other common domains you expect to load from
    ],
  },
};

module.exports = nextConfig;
