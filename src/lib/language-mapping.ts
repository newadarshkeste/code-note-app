export function getLanguageId(language: string): number | null {
  const map: Record<string, number> = {
    java: 62,
    javascript: 63,
    typescript: 74,
    c: 50,
    cpp: 54,
    python: 71,
    csharp: 51,
    ruby: 72,
    go: 60,
    swift: 83,
    kotlin: 78,
    rust: 73,
    php: 68,
    perl: 85,
    lua: 64,
    haskell: 61,
    sql: 82,
    bash: 46,
    plaintext: 43,
  };

  if (!language) return null;
  const key = language.toLowerCase().trim();

  return map[key] ?? null;
}
