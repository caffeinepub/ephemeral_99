export const idlFactory = ({ IDL }) => {
  const _CaffeineStorageCreateCertificateResult = IDL.Record({
    method: IDL.Text,
    blob_hash: IDL.Text,
  });
  const _CaffeineStorageRefillInformation = IDL.Record({
    proposed_top_up_amount: IDL.Opt(IDL.Nat),
  });
  const _CaffeineStorageRefillResult = IDL.Record({
    success: IDL.Opt(IDL.Bool),
    topped_up_amount: IDL.Opt(IDL.Nat),
  });
  const UserSearchResult = IDL.Record({
    principal: IDL.Principal,
    username: IDL.Text,
    name: IDL.Text,
  });
  const ChatListItem = IDL.Record({
    friendName: IDL.Text,
    unviewedSnapCount: IDL.Nat,
    lastActivityType: IDL.Text,
    friendUsername: IDL.Text,
    unviewedSnapId: IDL.Opt(IDL.Nat),
    friendPrincipal: IDL.Principal,
    lastActivityAt: IDL.Int,
    streakAtRisk: IDL.Bool,
    streakCount: IDL.Nat,
  });
  const ConversationItem = IDL.Record({
    status: IDL.Text,
    createdAt: IDL.Int,
    sender: IDL.Principal,
    expirationSeconds: IDL.Nat,
    snapId: IDL.Nat,
  });
  const FriendRequestView = IDL.Record({
    id: IDL.Nat,
    principal: IDL.Principal,
    username: IDL.Text,
    name: IDL.Text,
    createdAt: IDL.Int,
  });
  const FriendRequestsResult = IDL.Record({
    incoming: IDL.Vec(FriendRequestView),
    outgoing: IDL.Vec(FriendRequestView),
  });
  const StoryView = IDL.Record({
    authorUsername: IDL.Text,
    storyId: IDL.Nat,
    createdAt: IDL.Int,
    authorName: IDL.Text,
    author: IDL.Principal,
    mediaType: IDL.Text,
  });
  const InboxItem = IDL.Record({
    isViewed: IDL.Bool,
    createdAt: IDL.Int,
    sender: IDL.Principal,
    expirationSeconds: IDL.Nat,
    snapId: IDL.Nat,
    senderName: IDL.Text,
  });
  const Profile = IDL.Record({ username: IDL.Text, name: IDL.Text });
  const SentSnapItem = IDL.Record({
    createdAt: IDL.Int,
    viewedCount: IDL.Nat,
    snapId: IDL.Nat,
    recipientCount: IDL.Nat,
  });
  const ExternalBlob = IDL.Vec(IDL.Nat8);
  const SnapViewResult = IDL.Record({
    expirationSeconds: IDL.Nat,
    mediaBlob: ExternalBlob,
    mediaType: IDL.Text,
  });
  const StoryMediaResult = IDL.Record({
    mediaBlob: ExternalBlob,
    mediaType: IDL.Text,
  });
  const StreakView = IDL.Record({
    isAtRisk: IDL.Bool,
    friendName: IDL.Text,
    count: IDL.Nat,
    friendUsername: IDL.Text,
    lastExchangeAt: IDL.Int,
    friendPrincipal: IDL.Principal,
  });
  return IDL.Service({
    _caffeineStorageBlobIsLive: IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Bool],
      ["query"],
    ),
    _caffeineStorageBlobsToDelete: IDL.Func(
      [],
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      ["query"],
    ),
    _caffeineStorageConfirmBlobDeletion: IDL.Func(
      [IDL.Vec(IDL.Vec(IDL.Nat8))],
      [],
      [],
    ),
    _caffeineStorageCreateCertificate: IDL.Func(
      [IDL.Text],
      [_CaffeineStorageCreateCertificateResult],
      [],
    ),
    _caffeineStorageRefillCashier: IDL.Func(
      [IDL.Opt(_CaffeineStorageRefillInformation)],
      [_CaffeineStorageRefillResult],
      [],
    ),
    _caffeineStorageUpdateGatewayPrincipals: IDL.Func([], [], []),
    blockUser: IDL.Func([IDL.Principal], [], []),
    deleteStory: IDL.Func([IDL.Nat], [], []),
    getBlockedUsers: IDL.Func([], [IDL.Vec(UserSearchResult)], ["query"]),
    getChatList: IDL.Func([], [IDL.Vec(ChatListItem)], ["query"]),
    getConversation: IDL.Func(
      [IDL.Principal],
      [IDL.Vec(ConversationItem)],
      ["query"],
    ),
    getFriendRequests: IDL.Func([], [FriendRequestsResult], ["query"]),
    getFriends: IDL.Func([], [IDL.Vec(UserSearchResult)], ["query"]),
    getFriendsStories: IDL.Func([], [IDL.Vec(StoryView)], ["query"]),
    getInbox: IDL.Func([], [IDL.Vec(InboxItem)], ["query"]),
    getMyStories: IDL.Func([], [IDL.Vec(StoryView)], ["query"]),
    getProfile: IDL.Func([], [IDL.Opt(Profile)], ["query"]),
    getSentSnaps: IDL.Func([], [IDL.Vec(SentSnapItem)], ["query"]),
    getSnapMedia: IDL.Func([IDL.Nat], [SnapViewResult], ["query"]),
    getStoryMedia: IDL.Func([IDL.Nat], [StoryMediaResult], ["query"]),
    getStreaks: IDL.Func([], [IDL.Vec(StreakView)], ["query"]),
    postStory: IDL.Func([ExternalBlob, IDL.Text], [], []),
    respondToFriendRequest: IDL.Func([IDL.Nat, IDL.Bool], [], []),
    searchUsers: IDL.Func([IDL.Text], [IDL.Vec(UserSearchResult)], ["query"]),
    sendFriendRequest: IDL.Func([IDL.Principal], [], []),
    sendSnap: IDL.Func(
      [IDL.Vec(IDL.Principal), ExternalBlob, IDL.Text, IDL.Nat],
      [],
      [],
    ),
    setProfile: IDL.Func([IDL.Text, IDL.Text], [], []),
    unblockUser: IDL.Func([IDL.Principal], [], []),
    unfriend: IDL.Func([IDL.Principal], [], []),
    viewSnap: IDL.Func([IDL.Nat], [SnapViewResult], []),
  });
};
export const init = ({ IDL }) => {
  return [];
};
