import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, relative, dirname } from 'node:path';

// Library build, tree-shakable from the first component (Pane R-024, gate G-TS1). ESM keeps one file per
// source module (preserveModules), so importing Stack pulls in Stack and what it imports, nothing else.
// Each ESM module imports its own CSS, so a bundler ships only the styles of the components used. CJS
// stays one file for require(). dist/styles.css still holds every component's styles for a plain <link>,
// and all.css (tooling/bundle-tokens.mjs) adds the tokens in front of it.
const injectCss = (): Plugin => ({
  name: 'kiln-inject-css',
  apply: 'build',
  enforce: 'post',
  generateBundle(options, bundle) {
    if (options.format !== 'es') return;
    const all: string[] = [];
    for (const f of Object.values(bundle)) if (f.type === 'asset' && f.fileName.endsWith('.css')) all.push(String(f.source));
    for (const chunk of Object.values(bundle)) {
      if (chunk.type !== 'chunk') continue;
      const own = [...((chunk as unknown as { viteMetadata?: { importedCss: Set<string> } }).viteMetadata?.importedCss ?? [])];
      if (!own.length) continue;
      const lines = own.map((c) => { let r = relative(dirname(chunk.fileName), c); if (!r.startsWith('.')) r = `./${r}`; return `import '${r}';`; }).join('\n');
      chunk.code = `${lines}\n${chunk.code}`;
    }
    this.emitFile({ type: 'asset', fileName: 'styles.css', source: all.join('\n') });
  },
});

// CSS files drop ".module" from their names: a consumer's bundler would otherwise treat them as CSS
// modules again and rename the classes the JS refers to.
const cssName = (a: { names?: string[]; name?: string }) => `css/${(a.names?.[0] ?? a.name ?? 'asset').replace(/\.module(?=\.css$)/, '')}`;

export default defineConfig({
  plugins: [react(), injectCss()],
  css: { modules: { generateScopedName: 'ds-[name]__[local]' } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: { entry: resolve(__dirname, 'src/index.ts') },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^@radix-ui\//],
      output: [
        { format: 'es', preserveModules: true, preserveModulesRoot: 'src', entryFileNames: '[name].js', assetFileNames: cssName },
        { format: 'cjs', entryFileNames: 'index.cjs', assetFileNames: cssName },
      ],
    },
  },
});
