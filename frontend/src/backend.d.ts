import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface RestrictionStatus {
    isRestricted: boolean;
    notified: boolean;
}
export interface ConversationItem {
    status: string;
    createdAt: bigint;
    sender: Principal;
    expirationSeconds: bigint;
    snapId: bigint;
}
export interface ChatListItem {
    isFriend: boolean;
    friendName: string;
    unviewedSnapCount: bigint;
    lastActivityType: string;
    friendUsername: string;
    unviewedSnapId?: bigint;
    friendPrincipal: Principal;
    lastActivityAt: bigint;
    streakAtRisk: boolean;
    streakCount: bigint;
}
export interface GroupView {
    id: bigint;
    members: Array<UserSearchResult>;
    name: string;
    createdAt: bigint;
}
export interface StreakView {
    isAtRisk: boolean;
    friendName: string;
    count: bigint;
    friendUsername: string;
    lastExchangeAt: bigint;
    friendPrincipal: Principal;
}
export interface SnapViewResult {
    expirationSeconds: bigint;
    mediaBlob: ExternalBlob;
    mediaType: string;
}
export interface SentSnapItem {
    createdAt: bigint;
    viewedCount: bigint;
    snapId: bigint;
    recipientCount: bigint;
}
export interface FriendRequestView {
    id: bigint;
    principal: Principal;
    username: string;
    name: string;
    createdAt: bigint;
}
export interface StoryMediaResult {
    mediaBlob: ExternalBlob;
    mediaType: string;
}
export interface Profile {
    username: string;
    name: string;
}
export interface UserSearchResult {
    principal: Principal;
    username: string;
    name: string;
}
export interface StoryView {
    authorUsername: string;
    storyId: bigint;
    createdAt: bigint;
    authorName: string;
    author: Principal;
    mediaType: string;
}
export interface InboxItem {
    isViewed: boolean;
    createdAt: bigint;
    sender: Principal;
    expirationSeconds: bigint;
    snapId: bigint;
    senderName: string;
}
export interface FriendRequestsResult {
    incoming: Array<FriendRequestView>;
    outgoing: Array<FriendRequestView>;
}
export interface backendInterface {
    acknowledgeRestriction(): Promise<void>;
    blockUser(target: Principal): Promise<void>;
    cancelFriendRequest(requestId: bigint): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createGroup(name: string, members: Array<Principal>): Promise<bigint>;
    deleteGroup(groupId: bigint): Promise<void>;
    deleteStory(storyId: bigint): Promise<void>;
    getBlockedUsers(): Promise<Array<UserSearchResult>>;
    getChatList(): Promise<Array<ChatListItem>>;
    getConversation(friend: Principal): Promise<Array<ConversationItem>>;
    getFriendRequests(): Promise<FriendRequestsResult>;
    getFriends(): Promise<Array<UserSearchResult>>;
    getFriendsStories(): Promise<Array<StoryView>>;
    getGroups(): Promise<Array<GroupView>>;
    getInbox(): Promise<Array<InboxItem>>;
    getMyReports(): Promise<Array<Principal>>;
    getMyStories(): Promise<Array<StoryView>>;
    getProfile(): Promise<Profile | null>;
    getRestrictionStatus(): Promise<RestrictionStatus>;
    getSentSnaps(): Promise<Array<SentSnapItem>>;
    getStoryMedia(storyId: bigint): Promise<StoryMediaResult>;
    getStreaks(): Promise<Array<StreakView>>;
    postStory(mediaBlob: ExternalBlob, mediaType: string): Promise<void>;
    reportUser(target: Principal): Promise<void>;
    respondToFriendRequest(requestId: bigint, accept: boolean): Promise<void>;
    searchUsers(prefix: string): Promise<Array<UserSearchResult>>;
    sendFriendRequest(to: Principal): Promise<void>;
    sendSnap(recipients: Array<Principal>, mediaBlob: ExternalBlob, mediaType: string, expirationSeconds: bigint): Promise<void>;
    setProfile(name: string, username: string): Promise<void>;
    unblockUser(target: Principal): Promise<void>;
    unfriend(target: Principal): Promise<void>;
    updateGroup(groupId: bigint, name: string, members: Array<Principal>): Promise<void>;
    viewSnap(snapId: bigint): Promise<SnapViewResult>;
    withdrawReport(target: Principal): Promise<void>;
}
