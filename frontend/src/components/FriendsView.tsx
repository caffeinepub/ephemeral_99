import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useFriends,
  useFriendRequests,
  useStreaks,
  useGroups,
  useBlockedUsers,
} from "../hooks/useQueries";
import { FriendsList } from "./FriendsList";
import { RequestsList } from "./RequestsList";
import { GroupsList } from "./GroupsList";
import { BlockedUsersList } from "./BlockedUsersList";
import { UserSearchDialog } from "./UserSearchDialog";

export function FriendsView() {
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    data: friends,
    isLoading: isLoadingFriends,
    isError: isFriendsError,
  } = useFriends();
  const {
    data: requests,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
  } = useFriendRequests();
  const { data: streaks } = useStreaks();
  const {
    data: groups,
    isLoading: isLoadingGroups,
    isError: isGroupsError,
  } = useGroups();
  const { data: blockedUsers } = useBlockedUsers();

  const streakMap = new Map(
    (streaks ?? []).map((s) => [s.friendPrincipal.toString(), s]),
  );

  const incomingCount = requests?.incoming?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-lg font-semibold text-foreground">Friends</h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSearchOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="friends" className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="friends" className="flex-1">
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 gap-1.5">
              Requests
              {incomingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1 text-xs"
                >
                  {incomingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1">
              Groups
            </TabsTrigger>
            {(blockedUsers?.length ?? 0) > 0 && (
              <TabsTrigger value="blocked" className="flex-1">
                Blocked
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="friends" className="flex-1 mt-0">
          <FriendsList
            friends={friends ?? []}
            isLoading={isLoadingFriends}
            isError={isFriendsError}
            streakMap={streakMap}
          />
        </TabsContent>

        <TabsContent value="requests" className="flex-1 mt-0">
          <RequestsList
            incoming={requests?.incoming ?? []}
            outgoing={requests?.outgoing ?? []}
            isLoading={isLoadingRequests}
            isError={isRequestsError}
          />
        </TabsContent>

        <TabsContent value="groups" className="flex-1 mt-0">
          <GroupsList
            groups={groups ?? []}
            isLoading={isLoadingGroups}
            isError={isGroupsError}
          />
        </TabsContent>

        <TabsContent value="blocked" className="flex-1 mt-0">
          <BlockedUsersList />
        </TabsContent>
      </Tabs>

      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
