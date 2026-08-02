import { execSync } from "node:child_process";

const LEGACY_TOKEN =
  "text-(display|h[123]|headline|subtitle|title|body|button|caption|label)(-[a-z]+)?\\b";
const ARBITRARY_SIZE = "text-\\[[0-9.]+(px|rem|em)\\]";

const ALLOWED_ARBITRARY: string[] = [];

function scan(pattern: string): string[] {
  try {
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
