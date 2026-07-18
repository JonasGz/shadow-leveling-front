import { execSync } from "node:child_process";

// A escala de fonte antiga era semântica e custom (display/h1/title-md/label-sm/
// …): 24 tokens para 13 valores distintos, com o peso embutido em cada tupla.
// Foi trocada pela escala nativa do Tailwind com os valores do design system
// (ver tailwind.config.js), e o peso passou a ser explícito no <Text>.
//
// Nada no build impede alguém de digitar `text-label-sm` de novo — a classe
// simplesmente não gera CSS e o texto renderiza no tamanho padrão, sem erro.
// Este teste é o que torna essa regressão barulhenta. Mesmo motivo para o
// `text-[17px]`: um valor arbitrário não quebra nada hoje e é exatamente como a
// escala anterior inchou.

const LEGACY_TOKEN =
  "text-(display|h[123]|headline|subtitle|title|body|button|caption|label)(-[a-z]+)?\\b";
const ARBITRARY_SIZE = "text-\\[[0-9.]+(px|rem|em)\\]";

// Exceções conscientes, não drift. Para entrar aqui tem que ser um caso que a
// escala genuinamente não atende, com o motivo escrito. Hoje: nenhum.
const ALLOWED_ARBITRARY: string[] = [];

/** Varre app/ e src/ e devolve as ocorrências (vazio = limpo). */
function scan(pattern: string): string[] {
  try {
    // grep sai com código 1 quando não acha nada — daí o try/catch.
    const out = execSync(
      `grep -rnE '${pattern}' app src --include='*.ts' --include='*.tsx'`,
      { cwd: process.cwd(), encoding: "utf8" },
    );
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

describe("escala tipográfica", () => {
  it("não usa nenhum token da escala antiga", () => {
    // Este arquivo contém os padrões literais; ele mesmo não conta.
    const hits = scan(LEGACY_TOKEN).filter(
      (l) => !l.startsWith("src/lib/typography.test.ts"),
    );
    expect(hits).toEqual([]);
  });

  it("não usa tamanho de fonte arbitrário fora das exceções", () => {
    const hits = scan(ARBITRARY_SIZE).filter(
      (l) =>
        !l.startsWith("src/lib/typography.test.ts") &&
        !ALLOWED_ARBITRARY.some((f) => l.startsWith(`${f}:`)),
    );
    expect(hits).toEqual([]);
  });
});
