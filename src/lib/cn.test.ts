import { cn } from "./cn";

describe("cn", () => {
  it("resolve conflito na escala numérica padrão", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("resolve conflito em toda a escala de espaçamento", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
    expect(cn("px-2", "px-10")).toBe("px-10");
    expect(cn("gap-1", "gap-4")).toBe("gap-4");
  });

  it("resolve conflito na escala de fontSize", () => {
    expect(cn("text-base", "text-xl")).toBe("text-xl");
    expect(cn("text-xs", "text-5xl")).toBe("text-5xl");
  });

  it("não confunde tamanho de fonte com cor de texto", () => {
    expect(cn("text-4xl", "text-gray-200")).toBe("text-4xl text-gray-200");
    expect(cn("text-gray-200", "text-purple-300")).toBe("text-purple-300");
  });

  it("deixa o peso vindo de fora vencer o do componente", () => {
    expect(cn("text-base font-semibold", "font-normal")).toBe(
      "text-base font-normal",
    );
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
    expect(cn("p-4", undefined, null, "p-6")).toBe("p-6");
  });

  it("deixa a classe recebida de fora vencer a base do componente", () => {
    expect(cn("rounded-lg bg-gray-600 p-4", "bg-purple-300")).toBe(
      "rounded-lg p-4 bg-purple-300",
    );
  });
});
