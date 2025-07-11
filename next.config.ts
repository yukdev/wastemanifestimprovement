const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  output: 'export',
  // Only set these for GitHub Pages!
  basePath: isGithubPages ? '/wastemanifestimprovement' : '',
  assetPrefix: isGithubPages ? '/wastemanifestimprovement/' : '',
};

export default nextConfig;
