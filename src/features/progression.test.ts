// Self-check da lógica de progressão. Sem framework — roda com:
//   npx tsx src/features/progression.test.ts
import assert from "node:assert/strict";
import { computeHint, nextWeight, prefillSets, type LastSet } from "./progression";

const S = (setNumber: number, reps: number | null, weight: number | null, duration: number | null = null): LastSet =>
  ({ setNumber, reps, weight, duration });

// nextWeight: piso 2,5kg e arredondamento ao múltiplo de 2,5.
assert.equal(nextWeight(20), 22.5);
assert.equal(nextWeight(100), 102.5);
assert.equal(nextWeight(200), 205);

// prefill: série-a-série; linha além do histórico fica vazia.
assert.deepEqual(
  prefillSets([S(1, 10, 20), S(2, 10, 20)], 3, false),
  [
    { weight: "20", reps: "10", duration: "" },
    { weight: "20", reps: "10", duration: "" },
    { weight: "", reps: "", duration: "" },
  ],
);
// prefill tempo: usa duração.
assert.deepEqual(prefillSets([S(1, null, null, 45)], 1, true), [{ weight: "", reps: "", duration: "45" }]);

// teto batido (faixa 8–10, fez 10,10,10) → sobe carga.
assert.match(computeHint([S(1, 10, 20), S(2, 10, 20), S(3, 10, 20)], 10, false)!.text, /tente 22\.5kg/);

// abaixo do teto (10,10,8) → meta de reps.
assert.match(computeHint([S(1, 10, 20), S(2, 10, 20), S(3, 8, 20)], 10, false)!.text, /chegue a 10 reps com 20kg/);

// sem histórico → null.
assert.equal(computeHint([], 10, false), null);
// repetição sem faixa → null.
assert.equal(computeHint([S(1, 10, 20)], null, false), null);
// tempo → supere a duração.
assert.match(computeHint([S(1, null, null, 45)], null, true)!.text, /supere os 45s/);

console.log("progression: all checks passed");
