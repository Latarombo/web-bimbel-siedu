// Resolve hook: tambahkan ekstensi .ts untuk import internal proyek (node >=22: --import)
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(new URL('./ts-resolve-hooks.mjs', import.meta.url), pathToFileURL('./'));
