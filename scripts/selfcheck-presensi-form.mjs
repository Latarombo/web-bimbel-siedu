// Windows: node --test scripts/selfcheck-presensi-form.mjs
// Render the actual form without starting Next.js or connecting to the database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/teacher/presensi-form.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(compiled, {
  exports: compiledModule.exports,
  module: compiledModule,
  require(name) {
    // Only isolate the server action and visual wrappers. React, intl, and
    // the form's actual inputs/default selection run unchanged.
    if (name === '@/app/actions/teacher') return { savePresensi: async () => ({ ok: true }) };
    if (name === '@/components/ui/button') return { Button: 'button' };
    if (name === '@/components/ui/field') return {
      Input: 'input',
      Field: ({ children }) => React.createElement('div', null, children),
    };
    return require(name);
  },
});
const PresensiForm = compiledModule.exports.default;

function render(locale, student = {}) {
  const messages = JSON.parse(readFileSync(new URL(`../src/i18n/messages/${locale}/teacher.json`, import.meta.url), 'utf8'));
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider, {
    locale, messages: { teacher: messages }, timeZone: 'Asia/Jakarta',
  }, React.createElement(PresensiForm, {
    kelasId: 1, jadwalItemId: 1, tanggal: '2026-09-17',
    siswa: [{ pendaftaranId: 1, nama: 'Murid uji', terkunci: false, ...student }],
  })));
}

for (const locale of ['id', 'en']) {
  test(`presensi ${locale}: payload uses canonical codes, not translated labels`, () => {
    const html = render(locale, { status: 'hadir' });
    const radios = [...html.matchAll(/<input\b[^>]*type="radio"[^>]*>/g)].map(([tag]) => tag);
    assert.equal(radios.length, 4);
    assert.deepEqual(radios.map(tag => tag.match(/value="([^"]*)"/)[1]), ['hadir', 'izin', 'sakit', 'alpa']);
    const label = locale === 'en' ? 'present' : 'hadir';
    assert.ok(html.includes(`/>${label}</label>`), 'visible label remains translated');
  });
}
