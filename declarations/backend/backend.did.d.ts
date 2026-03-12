import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface ChatListItem {
  friendName: string;
  unviewedSnapCount: bigint;
  lastActivityType: string;
  friendUsername: string;
  unviewedSnapId: [] | [bigint];
  friendPrincipal: Principal;
  lastActivityAt: bigint;
  streakAtRisk: boolean;
  streakCount: bigint;
}
export interface ConversationItem {
  status: string;
  createdAt: bigint;
  sender: Principal;
  expirationSeconds: bigint;
  snapId: bigint;
}
export type ExternalBlob = Uint8Array | number[];
export interface FriendRequestView {
  id: bigint;
  principal: Principal;
  username: string;
  name: string;
  createdAt: bigint;
}
export interface FriendRequestsResult {
  incoming: Array<FriendRequestView>;
  outgoing: Array<FriendRequestView>;
}
export interface InboxItem {
  isViewed: boolean;
  createdAt: bigint;
  sender: Principal;
  expirationSeconds: bigint;
  snapId: bigint;
  senderName: string;
}
export interface Profile {
  username: string;
  name: string;
}
export interface SentSnapItem {
  createdAt: bigint;
  viewedCount: bigint;
  snapId: bigint;
  recipientCount: bigint;
}
export interface SnapViewResult {
  expirationSeconds: bigint;
  mediaBlob: ExternalBlob;
  mediaType: string;
}
export interface StoryMediaResult {
  mediaBlob: ExternalBlob;
  mediaType: string;
}
export interface StoryView {
  authorUsername: string;
  storyId: bigint;
  createdAt: bigint;
  authorName: string;
  author: Principal;
  mediaType: string;
}
export interface StreakView {
  isAtRisk: boolean;
  friendName: string;
  count: bigint;
  friendUsername: string;
  lastExchangeAt: bigint;
  friendPrincipal: Principal;
}
export interface UserSearchResult {
  principal: Principal;
  username: string;
  name: string;
}
export interface _CaffeineStorageCreateCertificateResult {
  method: string;
  blob_hash: string;
}
export interface _CaffeineStorageRefillInformation {
  proposed_top_up_amount: [] | [bigint];
}
export interface _CaffeineStorageRefillResult {
  success: [] | [boolean];
  topped_up_amount: [] | [bigint];
}
export interface _SERVICE {
  _caffeineStorageBlobIsLive: ActorMethod<[Uint8Array | number[]], boolean>;
  _caffeineStorageBlobsToDelete: ActorMethod<[], Array<Uint8Array | number[]>>;
  _caffeineStorageConfirmBlobDeletion: ActorMethod<
    [Array<Uint8Array | number[]>],
    undefined
  >;
  _caffeineStorageCreateCertificate: ActorMethod<
    [string],
    _CaffeineStorageCreateCertificateResult
  >;
  _caffeineStorageRefillCashier: ActorMethod<
    [[] | [_CaffeineStorageRefillInformation]],
    _CaffeineStorageRefillResult
  >;
  _caffeineStorageUpdateGatewayPrincipals: ActorMethod<[], undefined>;
  blockUser: ActorMethod<[Principal], undefined>;
  deleteStory: ActorMethod<[bigint], undefined>;
  getBlockedUsers: ActorMethod<[], Array<UserSearchResult>>;
  getChatList: ActorMethod<[], Array<ChatListItem>>;
  getConversation: ActorMethod<[Principal], Array<ConversationItem>>;
  getFriendRequests: ActorMethod<[], FriendRequestsResult>;
  getFriends: ActorMethod<[], Array<UserSearchResult>>;
  getFriendsStories: ActorMethod<[], Array<StoryView>>;
  getInbox: ActorMethod<[], Array<InboxItem>>;
  getMyStories: ActorMethod<[], Array<StoryView>>;
  getProfile: ActorMethod<[], [] | [Profile]>;
  getSentSnaps: ActorMethod<[], Array<SentSnapItem>>;
  getSnapMedia: ActorMethod<[bigint], SnapViewResult>;
  getStoryMedia: ActorMethod<[bigint], StoryMediaResult>;
  getStreaks: ActorMethod<[], Array<StreakView>>;
  postStory: ActorMethod<[ExternalBlob, string], undefined>;
  respondToFriendRequest: ActorMethod<[bigint, boolean], undefined>;
  searchUsers: ActorMethod<[string], Array<UserSearchResult>>;
  sendFriendRequest: ActorMethod<[Principal], undefined>;
  sendSnap: ActorMethod<
    [Array<Principal>, ExternalBlob, string, bigint],
    undefined
  >;
  setProfile: ActorMethod<[string, string], undefined>;
  unblockUser: ActorMethod<[Principal], undefined>;
  unfriend: ActorMethod<[Principal], undefined>;
  viewSnap: ActorMethod<[bigint], SnapViewResult>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
