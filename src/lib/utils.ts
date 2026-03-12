export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function childLabel(child: string): string {
  switch (child) {
    case "asher":
      return "Asher's Journal";
    case "aiden":
      return "Aiden's Journal";
    case "family":
      return "Family Journal";
    case "both":
      return "Both Boys";
    default:
      return "Journal";
  }
}
