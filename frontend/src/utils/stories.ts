import type { StoryView } from "@/backend";
export type { StoryView };

export interface AuthorGroup {
  authorPrincipal: string;
  authorName: string;
  authorUsername: string;
  stories: StoryView[];
}

// Groups a flat array of stories by author, sorted by most recent story per group
export function groupStoriesByAuthor(stories: StoryView[]): AuthorGroup[] {
  const map = new Map<string, AuthorGroup>();

  for (const story of stories) {
    const key = story.author.toString();
    const existing = map.get(key);
    if (existing) {
      existing.stories.push(story);
    } else {
      map.set(key, {
        authorPrincipal: key,
        authorName: story.authorName,
        authorUsername: story.authorUsername,
        stories: [story],
      });
    }
  }

  // Sort stories within each group by createdAt descending (newest first)
  for (const group of map.values()) {
    group.stories.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }

  // Sort groups by most recent story (newest first)
  return Array.from(map.values()).sort(
    (a, b) => Number(b.stories[0].createdAt) - Number(a.stories[0].createdAt),
  );
}
