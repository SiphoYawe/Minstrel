import nextConfig from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintConfigPrettier,
];

export default eslintConfig;
