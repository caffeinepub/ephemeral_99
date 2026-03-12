import {
  fromUnixTime,
  formatDistanceToNow,
  addHours,
  isPast,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

export function fromNanoseconds(timestamp: bigint): Date {
  return fromUnixTime(Number(timestamp) / 1_000_000_000);
}

export function timeAgo(timestamp: bigint): string {
  const date = fromNanoseconds(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function shortTimeAgo(timestamp: bigint): string {
  const date = fromNanoseconds(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
}

export function storyTimeRemaining(createdAt: bigint): string {
  const created = fromNanoseconds(createdAt);
  const expiresAt = addHours(created, 24);
  if (isPast(expiresAt)) return "expired";
  const hours = differenceInHours(expiresAt, new Date());
  if (hours > 0) return `${hours}h`;
  const minutes = differenceInMinutes(expiresAt, new Date());
  return `${minutes}m`;
}
