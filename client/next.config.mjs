/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite exportación estática (hosting tipo S3/Netlify/Render static).
  // Nota: con esto no puedes usar features server/dynamic.
  output: 'export',
};

export default nextConfig;
