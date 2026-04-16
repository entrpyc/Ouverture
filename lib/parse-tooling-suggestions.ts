const PREFIX = "Tooling suggestion:";

export function parseMessageContent(content: string): {
  text: string;
  suggestions: string[];
} {
  const lines = content.split("\n");
  const textLines: string[] = [];
  const suggestions: string[] = [];

  for (const line of lines) {
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith(PREFIX)) {
      const suggestion = trimmedStart.slice(PREFIX.length).trim();
      if (suggestion) suggestions.push(suggestion);
    } else {
      textLines.push(line);
    }
  }

  return {
    text: textLines.join("\n").trim(),
    suggestions,
  };
}
