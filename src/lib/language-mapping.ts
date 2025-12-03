export function getLanguageId(language: string): number | null {
  if (!language) return null;

  const lang = language.toLowerCase().trim();

  if (lang.includes("java")) return 62;
  if (lang.includes("javascript")) return 63;
  if (lang.includes("typescript")) return 74;
  if (lang.includes("python")) return 71;
  if (lang.includes("cpp") || lang.includes("c++")) return 54;
  if (lang.includes("c#") || lang.includes("csharp")) return 51;
  if (lang.includes("ruby")) return 72;
  if (lang.includes("php")) return 68;
  if (lang.includes("go")) return 60;
  if (lang.includes("swift")) return 83;
  if (lang.includes('c') && !(lang.includes('cpp') || lang.includes('c++') || lang.includes('csharp'))) return 50;
  if (lang.includes("sql")) return 82;
  if (lang.includes("bash")) return 46;
  if (lang.includes("plaintext")) return 43;

  return null;
}
