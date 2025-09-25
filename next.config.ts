
import 'dotenv/config';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Default is 1mb
      executionTimeout: 120, // Default is around 15s
    },
  },
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  allowedDevOrigins: [
    'https://*.cluster-ys234awlzbhwoxmkkse6qo3fz6.cloudworkstations.dev',
  ],
};

export default nextConfig;
