import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { codeInspectorPlugin } from 'code-inspector-plugin'
import { defineConfig } from 'vite'
import { analyzer } from 'vite-bundle-analyzer'
import { checker } from 'vite-plugin-checker'
import { createHtmlPlugin } from 'vite-plugin-html'
import tsconfigPaths from 'vite-tsconfig-paths'

import PKG from '../../package.json'
import { ogImagePlugin } from '../../plugins/og-image-plugin'
import { createDependencyChunksPlugin } from '../../plugins/vite/deps'
import { createFeedSitemapPlugin } from '../../plugins/vite/feed-sitemap'
import { localesJsonPlugin } from '../../plugins/vite/locales-json'
import { siteConfig } from '../../site.config'

if (process.env.CI) {
  rmSync(path.join(process.cwd(), 'src/pages/(debug)'), {
    recursive: true,
    force: true,
  })
}

const ReactCompilerConfig = {
  /* ... */
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),

    tsconfigPaths(),
    checker({
      typescript: true,
      enableBuild: true,
    }),
    codeInspectorPlugin({
      bundler: 'vite',
      hotKeys: ['altKey'],
    }),
    createDependencyChunksPlugin([
      ['heic-to'],
      ['react', 'react-dom'],
      ['i18next', 'i18next-browser-languagedetector', 'react-i18next'],
    ]),
    localesJsonPlugin(),
    tailwindcss(),
    ogImagePlugin({
      title: siteConfig.title,
      description: siteConfig.description,
      siteName: siteConfig.name,
      siteUrl: siteConfig.url,
    }),
    createFeedSitemapPlugin(siteConfig),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      },
      inject: {
        data: {
          title: siteConfig.title,
          description: siteConfig.description,
        },
      },
    }),
    process.env.analyzer && analyzer(),
  ],
  server: {
    port: 1924, // 1924 年首款 35mm 相机问世
  },
  define: {
    APP_DEV_CWD: JSON.stringify(process.cwd()),
    APP_NAME: JSON.stringify(PKG.name),
    BUILT_DATE: JSON.stringify(new Date().toLocaleDateString()),
    GIT_COMMIT_HASH: JSON.stringify(getGitHash()),
  },
})

function getGitHash() {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
  } catch (e) {
    console.error('Failed to get git hash', e)
    return ''
  }
}
