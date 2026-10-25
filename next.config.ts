import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep AGENTS.md limited to the team's shared rules; next dev would otherwise append its own block.
  agentRules: false,
};

export default nextConfig;
