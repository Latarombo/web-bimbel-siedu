import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/.test(specifier)) {
    const base = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(base))) return next(specifier + '.ts', context);
    const idx = new URL(specifier + '/index.ts', context.parentURL);
    if (existsSync(fileURLToPath(idx))) return next(specifier + '/index.ts', context);
  }
  return next(specifier, context);
}
