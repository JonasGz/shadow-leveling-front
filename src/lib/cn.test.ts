import { cn } from "./cn";

// O valor de cn() está todo na configuração de classGroups: se um grupo custom
// não estiver registrado, o merge falha em silêncio (mantém as duas classes, e
// quem vence passa a depender da ordem de geração do CSS). Estes testes existem
// para que essa falha seja barulhenta.
describe("cn", () => {
  it("resolve conflito na escala numérica padrão", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("resolve conflito na escala de espaçamento nomeada do config", () => {
    expect(cn("p-md", "p-lg")).toBe("p-lg");
    expect(cn("px-sm", "px-xl")).toBe("px-xl");
    expect(cn("gap-xs", "gap-md")).toBe("gap-md");
  });

  it("resolve conflito entre os fontSize custom", () => {
    // Este é o caso que existia como hack de regex em Button.tsx.
    expect(cn("text-body", "text-title")).toBe("text-title");
    expect(cn("text-caption", "text-display-xxl")).toBe("text-display-xxl");
  });

  it("não confunde tamanho de fonte com cor de texto", () => {
    // Ambos são `text-*`, mas são propriedades diferentes: as duas sobrevivem.
    expect(cn("text-h1", "text-gray-200")).toBe("text-h1 text-gray-200");
    // E cor ainda conflita com cor.
    expect(cn("text-gray-200", "text-purple-300")).toBe("text-purple-300");
  });

  it("resolve conflito na escala de elevação do design system", () => {
    expect(cn("shadow-low", "shadow-high")).toBe("shadow-high");
  });

  it("mantém propriedades distintas lado a lado", () => {
    expect(cn("flex-row", "items-center", "bg-gray-600")).toBe(
      "flex-row items-center bg-gray-600",
    );
  });

  it("aceita condicionais do clsx", () => {
    expect(cn("bg-gray-600", false && "bg-purple-300")).toBe("bg-gray-600");
    expect(cn("bg-gray-600", true && "bg-purple-300")).toBe("bg-purple-300");
    expect(cn("p-md", undefined, null, "p-lg")).toBe("p-lg");
  });

  it("deixa a classe recebida de fora vencer a base do componente", () => {
    // Padrão de Card/Button: base + className da prop.
    expect(cn("rounded-lg bg-gray-600 p-md", "bg-purple-300")).toBe(
      "rounded-lg p-md bg-purple-300",
    );
  });
});
