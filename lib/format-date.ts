export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 45) return "just now";
  if (abs < 90) return "a minute ago";
  const diffMin = Math.round(diffSec / 60);
  if (abs < 60 * 45) return `${diffMin} minutes ago`;
  if (abs < 60 * 90) return "an hour ago";
  const diffHr = Math.round(diffSec / 3600);
  if (abs < 3600 * 22) return `${diffHr} hours ago`;
  if (abs < 3600 * 36) return "a day ago";
  const diffDay = Math.round(diffSec / 86400);
  if (abs < 86400 * 26) return `${diffDay} days ago`;
  const diffMonth = Math.round(diffSec / (86400 * 30));
  if (abs < 86400 * 320) return `${diffMonth} months ago`;
  const diffYear = Math.round(diffSec / (86400 * 365));
  return diffYear === 1 ? "a year ago" : `${diffYear} years ago`;
}

export function formatAbsolute(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
