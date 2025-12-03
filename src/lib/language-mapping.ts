export const languageMap: Record<string, number> = {
    'java': 62,
    'javascript': 63,
    'cpp': 54,
    'c': 50,
    'python': 71,
    'csharp': 51,
    // The rest of the original map for other languages
    'plaintext': 43, 
    'text': 0,
    'go': 60,
    'php': 68,
    'ruby': 72,
    'perl': 85,
    'lua': 64,
    'bash': 46,
    'haskell': 61,
    'fsharp': 86,
    'ocaml': 67,
    'rust': 73,
    'kotlin': 78,
    'swift': 83,
    'sql': 82,
    'assembly': 45,
    'typescript': 74,
};

export function getLanguageId(languageName: string): number | null {
    if (!languageName) return null;
    const lowerCaseLang = languageName.toLowerCase();
    return languageMap[lowerCaseLang] || null;
}
