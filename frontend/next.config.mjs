/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["app", "components", "lib", "hooks", "types"],
  },
};

export default nextConfig;
