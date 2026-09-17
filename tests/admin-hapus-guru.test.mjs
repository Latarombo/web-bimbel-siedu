import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Static regression: enforce the role restriction on the DELETE itself,
// not on an earlier read that could race with a role change. No database needed.
test("hapusGuru DELETE constrains both the requested id and guru role", () => {
  const source = ts.createSourceFile(
    "admin.ts",
    readFileSync(new URL("../src/app/actions/admin.ts", import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const action = source.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "hapusGuru",
  );
  assert.ok(action?.body, "hapusGuru must exist");
  const deletes = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "delete"
    ) deletes.push(node);
    ts.forEachChild(node, visit);
  }
  visit(action.body);
  assert.equal(deletes.length, 1, "expect one final DELETE");
  const where = deletes[0].expression.expression;
  assert.ok(ts.isCallExpression(where));
  assert.equal(where.expression.getText(source), "db.orm.public.User.where");
  const predicate = where.arguments[0];
  assert.ok(ts.isObjectLiteralExpression(predicate));
  const fields = Object.fromEntries(predicate.properties.map((property) => {
    assert.ok(ts.isPropertyAssignment(property));
    return [property.name.getText(source), property.initializer.getText(source)];
  }));
  assert.deepEqual(fields, { id: "guruId", role: '"guru"' });
});
