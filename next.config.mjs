// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lgyugeqtfhqrycymlxzj.supabase.co',
                port: '',
                pathname: '/storage/v1/object/sign/**'
            },
        ],
    },
};

export default nextConfig;