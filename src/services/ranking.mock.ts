import type { Title } from "../types/api.types";

/**
 * Ranking global — mock.
 *
 * ponytail: dados fixos até a rota real existir. Quando o backend expuser
 * `GET /ranking`, troque `fetchGlobalRanking` por uma chamada em
 * `ranking.service.ts`; a tela consome só este tipo e a Promise.
 */
export interface GlobalRankingEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  level: number;
  title: Title;
}

export interface GlobalRanking {
  entries: GlobalRankingEntry[];
  /** Posição do usuário logado (1-based), mesmo fora do top N. */
  my_position: number;
  me: GlobalRankingEntry;
}

const ENTRIES: GlobalRankingEntry[] = [
  {
    user_id: "1",
    name: "Rafael Moraes",
    avatar_url: null,
    level: 92,
    title: "Monarca",
  },
  {
    user_id: "2",
    name: "Bruna Lima",
    avatar_url: null,
    level: 74,
    title: "Soberano",
  },
  {
    user_id: "3",
    name: "Diego Alves",
    avatar_url: null,
    level: 68,
    title: "Comandante",
  },
  {
    user_id: "4",
    name: "Camila Rocha",
    avatar_url: null,
    level: 61,
    title: "Lendário",
  },
  {
    user_id: "5",
    name: "Léo Fernandes",
    avatar_url: null,
    level: 57,
    title: "Lendário",
  },
  {
    user_id: "6",
    name: "Marina Souza",
    avatar_url: null,
    level: 52,
    title: "Inquebrável",
  },
  {
    user_id: "7",
    name: "Thiago Nunes",
    avatar_url: null,
    level: 48,
    title: "Inquebrável",
  },
  {
    user_id: "8",
    name: "Ana Beatriz",
    avatar_url: null,
    level: 43,
    title: "Incansável",
  },
  {
    user_id: "9",
    name: "Pedro Castro",
    avatar_url: null,
    level: 39,
    title: "Incansável",
  },
  {
    user_id: "10",
    name: "Julia Mendes",
    avatar_url: null,
    level: 34,
    title: "Caçador",
  },
];

export async function fetchGlobalRanking(): Promise<GlobalRanking> {
  return {
    entries: ENTRIES,
    my_position: 47,
    me: {
      user_id: "me",
      name: "Você",
      avatar_url: null,
      level: 18,
      title: "Caçador",
    },
  };
}
