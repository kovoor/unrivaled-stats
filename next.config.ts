import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  agentRules: false,
  // The query string carries over, so /?season=2025 opens /stats/team?season=2025.
  async redirects() {
    return [{ source: "/", destination: "/stats/team", permanent: false }];
  },
};
export default nextConfig;
