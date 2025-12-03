const languageMap: { [key: string]: number } = {
    // Plain Text and other non-runnable types map to 0 or are handled separately
    'plaintext': 43, 
    'text': 0,

    // C-like languages
    'c': 50,
    'cpp': 54, // C++17
    'csharp': 65, // C# Mono
    'go': 60,
    'java': 62, // Java 15

    // Scripting languages
    'javascript': 63, // Node.js
    'typescript': 74,
    'python': 71, // Python 3.8
    'php': 68,
    'ruby': 72,
    'perl': 85,
    'lua': 64,
    'bash': 46,

    // Functional languages
    'haskell': 61,
    'fsharp': 86, // F# .NET
    'ocaml': 67,

    // Others
    'rust': 73,
    'kotlin': 78,
    'swift': 83,
    'sql': 82, // SQLite
    'assembly': 45, // NASM
};

export function getLanguageId(languageName: string): number | null {
    const lowerCaseLang = languageName.toLowerCase();
    return languageMap[lowerCaseLang] || null;
}
