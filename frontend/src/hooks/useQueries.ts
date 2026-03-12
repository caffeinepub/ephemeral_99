import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Principal } from "@icp-sdk/core/principal";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      username,
    }: {
      name: string;
      username: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(name, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useCheckUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["checkUsername", username],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.checkUsernameAvailability(username);
    },
    enabled: !!actor && !isFetching && username.length >= 3,
  });
}

export function useSearchUsers(prefix: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["searchUsers", prefix, identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.searchUsers(prefix);
    },
    enabled: !!actor && !isFetching && !!identity && prefix.length >= 1,
  });
}

export function useFriends() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["friends", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useFriendRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["friendRequests", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getFriendRequests();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (to: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.sendFriendRequest(to);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["searchUsers"] });
    },
  });
}

export function useCancelFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.cancelFriendRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      accept,
    }: {
      requestId: bigint;
      accept: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.respondToFriendRequest(requestId, accept);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useUnfriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.unfriend(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.blockUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}

export function useBlockedUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["blockedUsers", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getBlockedUsers();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.unblockUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useInbox() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["inbox", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getInbox();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useConversation(friendPrincipal: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: [
      "conversation",
      friendPrincipal,
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || !friendPrincipal) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.getConversation(Principal.fromText(friendPrincipal));
    },
    enabled: !!actor && !isFetching && !!identity && !!friendPrincipal,
  });
}

export function useChatList() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["chatList", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getChatList();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSentSnaps() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["sentSnaps", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getSentSnaps();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useViewSnap() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapId: number) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.viewSnap(BigInt(snapId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["chatList"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
}

export function usePostStory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaBytes,
      mediaType,
      onProgress,
    }: {
      mediaBytes: Uint8Array;
      mediaType: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const blob = ExternalBlob.fromBytes(
        new Uint8Array(mediaBytes.buffer) as Uint8Array<ArrayBuffer>,
      );
      if (onProgress) {
        blob.withUploadProgress(onProgress);
      }
      await actor.postStory(blob, mediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendsStories"] });
      queryClient.invalidateQueries({ queryKey: ["myStories"] });
    },
  });
}

export function useFriendsStories() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["friendsStories", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getFriendsStories();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMyStories() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["myStories", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getMyStories();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetStoryMedia() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (storyId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getStoryMedia(storyId);
    },
  });
}

export function useDeleteStory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteStory(storyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myStories"] });
      queryClient.invalidateQueries({ queryKey: ["friendsStories"] });
    },
  });
}

export function useStreaks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["streaks", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getStreaks();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSendSnap() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipients,
      mediaBytes,
      mediaType,
      expirationSeconds,
      onProgress,
    }: {
      recipients: Principal[];
      mediaBytes: Uint8Array;
      mediaType: string;
      expirationSeconds: number;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const blob = ExternalBlob.fromBytes(
        new Uint8Array(mediaBytes.buffer) as Uint8Array<ArrayBuffer>,
      );
      if (onProgress) {
        blob.withUploadProgress(onProgress);
      }
      await actor.sendSnap(
        recipients,
        blob,
        mediaType,
        BigInt(expirationSeconds),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sentSnaps"] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["chatList"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      queryClient.invalidateQueries({ queryKey: ["conversation"] });
    },
  });
}

export function useGroups() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["groups", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getGroups();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      members,
    }: {
      name: string;
      members: Principal[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createGroup(name, members);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      name,
      members,
    }: {
      groupId: bigint;
      name: string;
      members: Principal[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateGroup(groupId, name, members);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useReportUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.reportUser(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReports"] });
    },
  });
}

export function useWithdrawReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.withdrawReport(target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReports"] });
    },
  });
}

export function useMyReports() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["myReports", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getMyReports();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useRestrictionStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["restrictionStatus", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getRestrictionStatus();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAcknowledgeRestriction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      await actor.acknowledgeRestriction();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restrictionStatus"] });
    },
  });
}
