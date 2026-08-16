export function formatMoney(amount: number | null | undefined): string {
  return "KSh " + Number(amount || 0).toLocaleString();
}

export function formatSalary(salary: number): string {
  return formatMoney(salary);
}

export function timeAgo(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + " days ago";
}

export function formatTime(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function initials(first?: string, last?: string): string {
  const a = (first || "").charAt(0);
  const b = (last || "").charAt(0);
  return (a + b).toUpperCase() || "?";
}

export function stars(rating: number | null | undefined): string {
  const value = Math.round(rating || 0);
  let out = "";
  for (let i = 0; i < 5; i++) {
    out += i < value ? "★" : "☆";
  }
  return out;
}
