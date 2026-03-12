import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAppStore } from "../hooks/useAppStore";
import { useFriendsStories, useMyStories } from "../hooks/useQueries";
import { type AuthorGroup, groupStoriesByAuthor } from "../utils/stories";
import { StoryCircle } from "./StoryCircle";

export function StoryBar() {
  const { setViewingStoryUserId, setViewingStoryIndex } = useAppStore();
  const { data: friendsStories, isError: isFriendsError } = useFriendsStories();
  const { data: myStories, isError: isMyError } = useMyStories();

  const friendGroups = groupStoriesByAuthor(friendsStories ?? []);
  const hasOwnStories = (myStories ?? []).length > 0;

  const handleOpenStory = (group: AuthorGroup) => {
    setViewingStoryUserId(group.authorPrincipal);
    setViewingStoryIndex(0);
  };

  const handleOpenOwnStory = () => {
    if (!hasOwnStories) return;
    setViewingStoryUserId("self");
    setViewingStoryIndex(0);
  };

  if (isFriendsError || isMyError) return null;
  if (!hasOwnStories && friendGroups.length === 0) return null;

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 px-4 py-3">
        <StoryCircle
          name="My Story"
          initial="+"
          hasStories={hasOwnStories}
          isOwn
          onClick={handleOpenOwnStory}
        />
        {friendGroups.map((group) => (
          <StoryCircle
            key={group.authorPrincipal}
            name={group.authorName}
            initial={group.authorName.charAt(0).toUpperCase()}
            hasStories
            onClick={() => handleOpenStory(group)}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
