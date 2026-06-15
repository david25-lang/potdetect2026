import type { NextConfig } from "next";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const parsedApi = new URL(rawApiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: parsedApi.protocol.replace(":", "") as "http" | "https",
        hostname: parsedApi.hostname,
        ...(parsedApi.port ? { port: parsedApi.port } : {}),
      },
    ],
  },
};

export default nextConfig;
