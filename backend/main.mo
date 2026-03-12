import Int "mo:core/Int";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Types

  type Profile = {
    name : Text;
    username : Text;
  };

  type UserSearchResult = {
    principal : Principal;
    name : Text;
    username : Text;
  };

  type FriendRequest = {
    id : Nat;
    from : Principal;
    to : Principal;
    createdAt : Int;
  };

  type FriendRequestView = {
    id : Nat;
    principal : Principal;
    name : Text;
    username : Text;
    createdAt : Int;
  };

  type FriendRequestsResult = {
    incoming : [FriendRequestView];
    outgoing : [FriendRequestView];
  };

  type Snap = {
    id : Nat;
    sender : Principal;
    mediaBlob : ?Storage.ExternalBlob;
    mediaType : Text;
    expirationSeconds : Nat;
    createdAt : Int;
  };

  type SnapRecipient = {
    snapId : Nat;
    recipient : Principal;
    viewedAt : ?Int;
  };

  type InboxItem = {
    snapId : Nat;
    sender : Principal;
    senderName : Text;
    expirationSeconds : Nat;
    createdAt : Int;
    isViewed : Bool;
  };

  type SentSnapItem = {
    snapId : Nat;
    recipientCount : Nat;
    viewedCount : Nat;
    createdAt : Int;
  };

  type SnapViewResult = {
    mediaBlob : Storage.ExternalBlob;
    mediaType : Text;
    expirationSeconds : Nat;
  };

  type Story = {
    id : Nat;
    author : Principal;
    mediaBlob : Storage.ExternalBlob;
    mediaType : Text;
    createdAt : Int;
  };

  type StoryView = {
    storyId : Nat;
    author : Principal;
    authorName : Text;
    authorUsername : Text;
    mediaType : Text;
    createdAt : Int;
  };

  type StoryMediaResult = {
    mediaBlob : Storage.ExternalBlob;
    mediaType : Text;
  };

  type Streak = {
    count : Nat;
    lastSentByA : Int;
    lastSentByB : Int;
    lastExchangeAt : Int;
  };

  type StreakView = {
    friendPrincipal : Principal;
    friendName : Text;
    friendUsername : Text;
    count : Nat;
    lastExchangeAt : Int;
    isAtRisk : Bool;
  };

  type ConversationItem = {
    snapId : Nat;
    sender : Principal;
    status : Text;
    createdAt : Int;
    expirationSeconds : Nat;
  };

  type ChatFriendActivity = {
    oldestUnviewedId : ?Nat;
    latestUnviewedAt : Int;
    unviewedCount : Nat;
    latestReceivedViewedAt : Int;
    latestSentDeliveredAt : Int;
    latestSentOpenedAt : Int;
  };

  type ChatListItem = {
    friendPrincipal : Principal;
    friendName : Text;
    friendUsername : Text;
    lastActivityAt : Int;
    lastActivityType : Text;
    unviewedSnapId : ?Nat;
    unviewedSnapCount : Nat;
    streakCount : Nat;
    streakAtRisk : Bool;
    isFriend : Bool;
  };

  type RestrictionStatus = {
    isRestricted : Bool;
    notified : Bool;
  };

  type Group = {
    id : Nat;
    name : Text;
    members : [Principal];
    createdAt : Int;
  };

  type GroupView = {
    id : Nat;
    name : Text;
    members : [UserSearchResult];
    createdAt : Int;
  };

  // State

  var userProfiles : Map.Map<Principal, Profile> = Map.empty();
  var usernameRegistry : Map.Map<Text, Principal> = Map.empty();
  var friendRequests : Map.Map<Nat, FriendRequest> = Map.empty();
  var friends : Map.Map<Text, Bool> = Map.empty();
  var blocked : Map.Map<Text, Bool> = Map.empty();
  var nextRequestId : Nat = 0;
  var snaps : Map.Map<Nat, Snap> = Map.empty();
  var snapRecipients : Map.Map<Text, SnapRecipient> = Map.empty();
  var nextSnapId : Nat = 0;
  var stories : Map.Map<Nat, Story> = Map.empty();
  var nextStoryId : Nat = 0;
  var streaks : Map.Map<Text, Streak> = Map.empty();
  var userGroups : Map.Map<Principal, Map.Map<Nat, Group>> = Map.empty();
  var nextGroupId : Nat = 0;
  var snapInteractions : Map.Map<Text, Bool> = Map.empty();
  var userReports : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  var reportCounts : Map.Map<Principal, Nat> = Map.empty();
  var restricted : Map.Map<Principal, Bool> = Map.empty();
  var restrictionNotified : Map.Map<Principal, Bool> = Map.empty();

  // Constants

  let twentyFourHoursNs : Int = 24 * 60 * 60 * 1_000_000_000;
  let sevenDaysNs : Int = 7 * 24 * 60 * 60 * 1_000_000_000;

  // Resource limits
  let maxFriendsPerUser : Nat = 5000;
  let maxFriendRequestsPerUser : Nat = 1000;
  let maxBlockedPerUser : Nat = 1000;
  let maxSnapsPerUser : Nat = 10000;
  let maxStoriesPerUser : Nat = 10000;
  let maxRecipientsPerSnap : Nat = 100;
  let maxSearchPrefixLength : Nat = 50;
  let maxGroupsPerUser : Nat = 100;
  let maxMembersPerGroup : Nat = 100;
  let maxGroupNameLength : Nat = 50;
  let reportThreshold : Nat = 3;
  let maxReportsPerUser : Nat = 1000;

  // Helpers

  func getMap<V>(store : Map.Map<Principal, Map.Map<Nat, V>>, user : Principal) : Map.Map<Nat, V> {
    switch (store.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, V>();
        store.add(user, m);
        m;
      };
    };
  };

  func getUserGroups(caller : Principal) : Map.Map<Nat, Group> {
    getMap(userGroups, caller);
  };

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func requireValidTarget(caller : Principal, target : Principal, action : Text) {
    if (caller == target) {
      Runtime.trap("Cannot " # action # " yourself");
    };
    if (target.isAnonymous()) {
      Runtime.trap("Invalid target");
    };
  };

  func enforceLimit(current : Nat, max : Nat, msg : Text) {
    if (current >= max) {
      Runtime.trap("Too many " # msg # " (max " # max.toText() # ")");
    };
  };

  func isValidUsername(username : Text) : Bool {
    let size = username.size();
    if (size < 3 or size > 20) {
      return false;
    };
    for (c in username.chars()) {
      let valid = (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '_';
      if (not valid) {
        return false;
      };
    };
    true;
  };

  func makeFriendKey(a : Principal, b : Principal) : Text {
    let aText = a.toText();
    let bText = b.toText();
    if (aText < bText) { aText # "_" # bText } else { bText # "_" # aText };
  };

  func makeBlockKey(blocker : Principal, target : Principal) : Text {
    blocker.toText() # "_" # target.toText();
  };

  func areFriends(a : Principal, b : Principal) : Bool {
    friends.get(makeFriendKey(a, b)) != null;
  };

  func isBlocked(blocker : Principal, target : Principal) : Bool {
    blocked.get(makeBlockKey(blocker, target)) != null;
  };

  func makeInteractionKey(sender : Principal, recipient : Principal) : Text {
    sender.toText() # "_" # recipient.toText();
  };

  func hasSentSnap(sender : Principal, recipient : Principal) : Bool {
    snapInteractions.get(makeInteractionKey(sender, recipient)) != null;
  };

  func hasInteraction(a : Principal, b : Principal) : Bool {
    hasSentSnap(a, b) or hasSentSnap(b, a);
  };

  func getUserReports(reporter : Principal) : Map.Map<Principal, Bool> {
    switch (userReports.get(reporter)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Bool>();
        userReports.add(reporter, m);
        m;
      };
    };
  };

  func isRestricted(user : Principal) : Bool {
    restricted.get(user) != null;
  };

  func getProfileInfo(p : Principal) : (Text, Text) {
    switch (userProfiles.get(p)) {
      case (?profile) { (profile.name, profile.username) };
      case (null) { ("Unknown", "") };
    };
  };

  func toUserSearchResult(principal : Principal, profile : Profile) : UserSearchResult {
    { principal; name = profile.name; username = profile.username };
  };

  let emptyActivity : ChatFriendActivity = {
    oldestUnviewedId = null;
    latestUnviewedAt = 0;
    unviewedCount = 0;
    latestReceivedViewedAt = 0;
    latestSentDeliveredAt = 0;
    latestSentOpenedAt = 0;
  };

  func getActivity(m : Map.Map<Text, ChatFriendActivity>, key : Text) : ChatFriendActivity {
    switch (m.get(key)) {
      case (?d) { d };
      case (null) { emptyActivity };
    };
  };

  // Returns (count, isAtRisk, lastExchangeAt) for an active streak, or (0, false, 0) if none
  func getActiveStreak(a : Principal, b : Principal, today : Int) : (Nat, Bool, Int) {
    switch (streaks.get(makeFriendKey(a, b))) {
      case (?streak) {
        let exchangeDay = utcDay(streak.lastExchangeAt);
        if (streak.count > 0 and today <= exchangeDay + 1) {
          (streak.count, today > exchangeDay, streak.lastExchangeAt);
        } else {
          (0, false, 0);
        };
      };
      case (null) { (0, false, 0) };
    };
  };

  func validateGroupInput(caller : Principal, name : Text, members : [Principal]) {
    if (name == "" or name.size() > maxGroupNameLength) {
      Runtime.trap("Group name must be 1-" # maxGroupNameLength.toText() # " characters");
    };
    if (members.size() < 2) {
      Runtime.trap("Group must have at least 2 members");
    };
    if (members.size() > maxMembersPerGroup) {
      Runtime.trap("Too many members (max " # maxMembersPerGroup.toText() # ")");
    };
    let seen = Map.empty<Principal, Bool>();
    for (member in members.vals()) {
      if (member == caller) {
        Runtime.trap("Cannot add yourself to a group");
      };
      if (not areFriends(caller, member)) {
        Runtime.trap("All group members must be friends");
      };
      if (seen.get(member) != null) {
        Runtime.trap("Duplicate member in group");
      };
      seen.add(member, true);
    };
  };

  func makeRecipientKey(snapId : Nat, recipient : Principal) : Text {
    snapId.toText() # "_" # recipient.toText();
  };

  func allRecipientsViewed(snapId : Nat) : Bool {
    for ((_, sr) in snapRecipients.entries()) {
      if (sr.snapId == snapId and sr.viewedAt == null) {
        return false;
      };
    };
    true;
  };

  func clearSnapMedia(snapId : Nat) {
    switch (snaps.get(snapId)) {
      case (?snap) {
        snaps.add(
          snapId,
          {
            id = snap.id;
            sender = snap.sender;
            mediaBlob = null;
            mediaType = snap.mediaType;
            expirationSeconds = snap.expirationSeconds;
            createdAt = snap.createdAt;
          },
        );
      };
      case (null) {};
    };
  };

  func isValidMediaType(mediaType : Text) : Bool {
    mediaType == "image/jpeg" or mediaType == "image/png" or mediaType == "video/webm" or mediaType == "video/mp4";
  };

  func isVideoMediaType(mediaType : Text) : Bool {
    mediaType == "video/webm" or mediaType == "video/mp4";
  };

  func validateMedia(mediaBlob : Storage.ExternalBlob, mediaType : Text) {
    if (not isValidMediaType(mediaType)) {
      Runtime.trap("Unsupported media type");
    };
    let maxSize : Nat = if (isVideoMediaType(mediaType)) { 52_428_800 } else {
      5_242_880;
    };
    if (mediaBlob.size() > maxSize) {
      Runtime.trap(if (isVideoMediaType(mediaType)) { "Video must be 50MB or smaller" } else { "Image must be 5MB or smaller" });
    };
  };

  func countUserSnaps(caller : Principal) : Nat {
    var count : Nat = 0;
    for ((_, snap) in snaps.entries()) {
      if (snap.sender == caller) {
        count += 1;
      };
    };
    count;
  };

  func countUserStories(caller : Principal) : Nat {
    let now = Time.now();
    var count : Nat = 0;
    for ((_, story) in stories.entries()) {
      if (story.author == caller and now - story.createdAt < twentyFourHoursNs) {
        count += 1;
      };
    };
    count;
  };

  func countUserFriends(caller : Principal) : Nat {
    var count : Nat = 0;
    for ((principal, _) in userProfiles.entries()) {
      if (principal != caller and areFriends(caller, principal)) {
        count += 1;
      };
    };
    count;
  };

  func countPendingRequests(caller : Principal) : Nat {
    var count : Nat = 0;
    for ((_, req) in friendRequests.entries()) {
      if (req.from == caller or req.to == caller) {
        count += 1;
      };
    };
    count;
  };

  func countBlockedUsers(caller : Principal) : Nat {
    var count : Nat = 0;
    for ((key, _) in blocked.entries()) {
      if (key.startsWith(#text(caller.toText() # "_"))) {
        count += 1;
      };
    };
    count;
  };

  func utcDay(timestampNs : Int) : Int {
    timestampNs / twentyFourHoursNs;
  };

  // Remove viewed snaps older than 7 days (lazy cleanup during writes)
  // Single-pass: build set of old snap IDs, then scan recipients once
  func cleanupOldSnaps() {
    let now = Time.now();
    let oldSnapIds = Map.empty<Nat, Bool>();
    // Pass 1: find all snaps older than 7 days
    for ((id, snap) in snaps.entries()) {
      if (now - snap.createdAt >= sevenDaysNs) {
        oldSnapIds.add(id, true);
      };
    };
    if (oldSnapIds.size() == 0) { return };
    // Pass 2: single scan of recipients — track unviewed and collect keys to remove
    let unviewedSnaps = Map.empty<Nat, Bool>();
    let recipientKeysToRemove = List.empty<Text>();
    for ((key, sr) in snapRecipients.entries()) {
      if (oldSnapIds.get(sr.snapId) != null) {
        recipientKeysToRemove.add(key);
        if (sr.viewedAt == null) {
          unviewedSnaps.add(sr.snapId, true);
        };
      };
    };
    // Remove snaps where all recipients have viewed, and their recipient records
    for ((id, _) in oldSnapIds.entries()) {
      if (unviewedSnaps.get(id) == null) {
        snaps.remove(id);
      };
    };
    for (key in recipientKeysToRemove.values()) {
      let sr = snapRecipients.get(key);
      switch (sr) {
        case (?r) {
          if (unviewedSnaps.get(r.snapId) == null) {
            snapRecipients.remove(key);
          };
        };
        case (null) {};
      };
    };
  };

  // Remove expired stories older than 24h
  func cleanupOldStories() {
    let now = Time.now();
    let toRemove = List.empty<Nat>();
    for ((id, story) in stories.entries()) {
      if (now - story.createdAt >= twentyFourHoursNs) {
        toRemove.add(id);
      };
    };
    for (id in toRemove.values()) {
      stories.remove(id);
    };
  };

  // Update streak when a snap is sent between two users.
  // Streak increments when BOTH sides have sent on a new UTC day since the last exchange.
  // Streak dies if a full calendar day passes without a completed exchange.
  func updateStreak(sender : Principal, recipient : Principal) {
    let key = makeFriendKey(sender, recipient);
    let now = Time.now();
    let today = utcDay(now);
    let senderIsA = sender.toText() < recipient.toText();
    switch (streaks.get(key)) {
      case (?streak) {
        let exchangeDay = utcDay(streak.lastExchangeAt);
        let lastSendDay = utcDay(
          if (streak.lastSentByA > streak.lastSentByB) {
            streak.lastSentByA;
          } else {
            streak.lastSentByB;
          }
        );
        // Deadline: 1 day after last exchange (or last send if no exchange yet)
        let deadlineDay = if (streak.lastExchangeAt > 0) {
          exchangeDay + 1;
        } else {
          lastSendDay + 1;
        };
        if (today > deadlineDay) {
          // Streak expired — start fresh
          streaks.add(
            key,
            {
              count = 0;
              lastSentByA = if (senderIsA) { now } else { 0 };
              lastSentByB = if (senderIsA) { 0 } else { now };
              lastExchangeAt = 0;
            },
          );
        } else {
          // Record this send
          let newLastA = if (senderIsA) { now } else { streak.lastSentByA };
          let newLastB = if (senderIsA) { streak.lastSentByB } else { now };
          // Both must have sent on or after the day after the last exchange
          let minDay = if (streak.lastExchangeAt > 0) {
            exchangeDay + 1;
          } else {
            0;
          };
          let aSentNew = newLastA > 0 and utcDay(newLastA) >= minDay;
          let bSentNew = newLastB > 0 and utcDay(newLastB) >= minDay;
          if (aSentNew and bSentNew) {
            // Exchange completed — increment streak
            streaks.add(
              key,
              {
                count = streak.count + 1;
                lastSentByA = newLastA;
                lastSentByB = newLastB;
                lastExchangeAt = now;
              },
            );
          } else {
            streaks.add(
              key,
              {
                count = streak.count;
                lastSentByA = newLastA;
                lastSentByB = newLastB;
                lastExchangeAt = streak.lastExchangeAt;
              },
            );
          };
        };
      };
      case (null) {
        streaks.add(
          key,
          {
            count = 0;
            lastSentByA = if (senderIsA) { now } else { 0 };
            lastSentByB = if (senderIsA) { 0 } else { now };
            lastExchangeAt = 0;
          },
        );
      };
    };
  };

  // Endpoints

  public query ({ caller }) func getProfile() : async ?Profile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(name : Text, username : Text) : async () {
    requireAuth(caller);
    if (name == "" or name.trimStart(#char ' ') == "") {
      Runtime.trap("Name cannot be empty");
    };
    if (name.size() > 100) {
      Runtime.trap("Name must be 100 characters or fewer");
    };
    if (not isValidUsername(username)) {
      Runtime.trap("Username must be 3-20 characters, lowercase letters, numbers, and underscores only");
    };
    switch (usernameRegistry.get(username)) {
      case (?existing) {
        if (existing != caller) {
          Runtime.trap("Username is already taken");
        };
      };
      case (null) {};
    };
    switch (userProfiles.get(caller)) {
      case (?oldProfile) {
        if (oldProfile.username != username) {
          usernameRegistry.remove(oldProfile.username);
        };
      };
      case (null) {};
    };
    usernameRegistry.add(username, caller);
    userProfiles.add(caller, { name; username });
  };

  public query func checkUsernameAvailability(username : Text) : async Bool {
    if (not isValidUsername(username)) { return false };
    usernameRegistry.get(username) == null;
  };

  public query ({ caller }) func searchUsers(prefix : Text) : async [UserSearchResult] {
    requireAuth(caller);
    if (prefix.size() < 1) {
      return [];
    };
    if (prefix.size() > maxSearchPrefixLength) {
      Runtime.trap("Search prefix too long (max " # maxSearchPrefixLength.toText() # ")");
    };
    let lowerQuery = prefix.toLower();
    let results = List.empty<UserSearchResult>();
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and not isBlocked(caller, principal) and not isBlocked(principal, caller) and not isRestricted(principal) and profile.username.startsWith(#text lowerQuery)) {
        results.add(toUserSearchResult(principal, profile));
      };
    };
    if (results.size() > 20) {
      results.toArray().vals().take(20).toArray();
    } else {
      results.toArray();
    };
  };

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async () {
    requireAuth(caller);
    if (caller == to) {
      Runtime.trap("Cannot send friend request to yourself");
    };
    if (to.isAnonymous()) {
      Runtime.trap("Invalid recipient");
    };
    if (userProfiles.get(to) == null) {
      Runtime.trap("User not found");
    };
    if (areFriends(caller, to)) {
      Runtime.trap("Already friends");
    };
    if (isBlocked(caller, to) or isBlocked(to, caller)) {
      Runtime.trap("Cannot send friend request");
    };
    if (isRestricted(caller)) {
      Runtime.trap("Your account is restricted");
    };
    enforceLimit(countPendingRequests(caller), maxFriendRequestsPerUser, "pending friend requests");
    // Check for existing request in either direction
    for ((_, req) in friendRequests.entries()) {
      if ((req.from == caller and req.to == to) or (req.from == to and req.to == caller)) {
        Runtime.trap("Friend request already pending");
      };
    };
    let id = nextRequestId;
    nextRequestId += 1;
    friendRequests.add(id, { id; from = caller; to; createdAt = Time.now() });
  };

  public shared ({ caller }) func respondToFriendRequest(requestId : Nat, accept : Bool) : async () {
    requireAuth(caller);
    switch (friendRequests.get(requestId)) {
      case (?req) {
        if (req.to != caller) {
          Runtime.trap("Not authorized to respond to this request");
        };
        // Check if either party blocked the other since the request was sent
        if (isBlocked(caller, req.from) or isBlocked(req.from, caller)) {
          Runtime.trap("Cannot respond to this request");
        };
        if (accept) {
          if (countUserFriends(caller) >= maxFriendsPerUser) {
            Runtime.trap("You have reached the maximum number of friends (max " # maxFriendsPerUser.toText() # ")");
          };
          if (countUserFriends(req.from) >= maxFriendsPerUser) {
            Runtime.trap("The other user has reached the maximum number of friends (max " # maxFriendsPerUser.toText() # ")");
          };
          friends.add(makeFriendKey(caller, req.from), true);
        };
        // Delete the request after accepting or rejecting
        friendRequests.remove(requestId);
      };
      case (null) {
        Runtime.trap("Friend request not found");
      };
    };
  };

  public shared ({ caller }) func cancelFriendRequest(requestId : Nat) : async () {
    requireAuth(caller);
    switch (friendRequests.get(requestId)) {
      case (?req) {
        if (req.from != caller) {
          Runtime.trap("Not authorized to cancel this request");
        };
        friendRequests.remove(requestId);
      };
      case (null) {
        Runtime.trap("Friend request not found");
      };
    };
  };

  public query ({ caller }) func getFriendRequests() : async FriendRequestsResult {
    requireAuth(caller);
    let incoming = List.empty<FriendRequestView>();
    let outgoing = List.empty<FriendRequestView>();
    for ((_, req) in friendRequests.entries()) {
      if (req.to == caller) {
        let (name, username) = getProfileInfo(req.from);
        incoming.add({
          id = req.id;
          principal = req.from;
          name;
          username;
          createdAt = req.createdAt;
        });
      } else if (req.from == caller) {
        let (name, username) = getProfileInfo(req.to);
        outgoing.add({
          id = req.id;
          principal = req.to;
          name;
          username;
          createdAt = req.createdAt;
        });
      };
    };
    { incoming = incoming.toArray(); outgoing = outgoing.toArray() };
  };

  public query ({ caller }) func getFriends() : async [UserSearchResult] {
    requireAuth(caller);
    let result = List.empty<UserSearchResult>();
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and areFriends(caller, principal)) {
        result.add(toUserSearchResult(principal, profile));
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func unfriend(target : Principal) : async () {
    requireAuth(caller);
    requireValidTarget(caller, target, "unfriend");
    let key = makeFriendKey(caller, target);
    if (friends.get(key) == null) {
      Runtime.trap("Not friends with this user");
    };
    friends.remove(key);
    streaks.remove(key);
  };

  public shared ({ caller }) func blockUser(target : Principal) : async () {
    requireAuth(caller);
    requireValidTarget(caller, target, "block");
    if (userProfiles.get(target) == null) {
      Runtime.trap("User not found");
    };
    enforceLimit(countBlockedUsers(caller), maxBlockedPerUser, "blocked users");
    // Remove friendship and streak if exists
    let friendKey = makeFriendKey(caller, target);
    friends.remove(friendKey);
    streaks.remove(friendKey);
    // Remove any pending friend requests between the two
    let requestsToRemove = List.empty<Nat>();
    for ((id, req) in friendRequests.entries()) {
      if ((req.from == caller and req.to == target) or (req.from == target and req.to == caller)) {
        requestsToRemove.add(id);
      };
    };
    for (id in requestsToRemove.values()) {
      friendRequests.remove(id);
    };
    blocked.add(makeBlockKey(caller, target), true);
  };

  public shared ({ caller }) func unblockUser(target : Principal) : async () {
    requireAuth(caller);
    let key = makeBlockKey(caller, target);
    if (blocked.get(key) == null) {
      Runtime.trap("User is not blocked");
    };
    blocked.remove(key);
  };

  public query ({ caller }) func getBlockedUsers() : async [UserSearchResult] {
    requireAuth(caller);
    let result = List.empty<UserSearchResult>();
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and isBlocked(caller, principal)) {
        result.add(toUserSearchResult(principal, profile));
      };
    };
    result.toArray();
  };

  public shared ({ caller }) func sendSnap(
    recipients : [Principal],
    mediaBlob : Storage.ExternalBlob,
    mediaType : Text,
    expirationSeconds : Nat,
  ) : async () {
    requireAuth(caller);
    if (recipients.size() == 0) {
      Runtime.trap("Must have at least one recipient");
    };
    if (recipients.size() > maxRecipientsPerSnap) {
      Runtime.trap("Too many recipients (max " # maxRecipientsPerSnap.toText() # ")");
    };
    validateMedia(mediaBlob, mediaType);
    if (expirationSeconds < 1 or expirationSeconds > 10) {
      Runtime.trap("Expiration must be between 1 and 10 seconds");
    };
    enforceLimit(countUserSnaps(caller), maxSnapsPerUser, "active snaps");
    // Validate all recipients are friends
    for (recipient in recipients.vals()) {
      if (recipient == caller) {
        Runtime.trap("Cannot send snap to yourself");
      };
      if (not areFriends(caller, recipient)) {
        Runtime.trap("All recipients must be friends");
      };
    };
    let id = nextSnapId;
    nextSnapId += 1;
    snaps.add(
      id,
      {
        id;
        sender = caller;
        mediaBlob = ?mediaBlob;
        mediaType;
        expirationSeconds;
        createdAt = Time.now();
      },
    );
    for (recipient in recipients.vals()) {
      snapRecipients.add(
        makeRecipientKey(id, recipient),
        {
          snapId = id;
          recipient;
          viewedAt = null;
        },
      );
      updateStreak(caller, recipient);
      snapInteractions.add(makeInteractionKey(caller, recipient), true);
    };
    cleanupOldSnaps();
  };

  public query ({ caller }) func getInbox() : async [InboxItem] {
    requireAuth(caller);
    let result = List.empty<InboxItem>();
    for ((_, sr) in snapRecipients.entries()) {
      if (sr.recipient == caller) {
        switch (snaps.get(sr.snapId)) {
          case (?snap) {
            if (not isBlocked(caller, snap.sender) and not isBlocked(snap.sender, caller)) {
              let (senderName, _) = getProfileInfo(snap.sender);
              result.add({
                snapId = snap.id;
                sender = snap.sender;
                senderName;
                expirationSeconds = snap.expirationSeconds;
                createdAt = snap.createdAt;
                isViewed = sr.viewedAt != null;
              });
            };
          };
          case (null) {};
        };
      };
    };
    // Sort by createdAt descending (most recent first)
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public query ({ caller }) func getSentSnaps() : async [SentSnapItem] {
    requireAuth(caller);
    let result = List.empty<SentSnapItem>();
    for ((_, snap) in snaps.entries()) {
      if (snap.sender == caller) {
        var recipientCount : Nat = 0;
        var viewedCount : Nat = 0;
        for ((_, sr) in snapRecipients.entries()) {
          if (sr.snapId == snap.id) {
            recipientCount += 1;
            if (sr.viewedAt != null) {
              viewedCount += 1;
            };
          };
        };
        result.add({
          snapId = snap.id;
          recipientCount;
          viewedCount;
          createdAt = snap.createdAt;
        });
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public shared ({ caller }) func viewSnap(snapId : Nat) : async SnapViewResult {
    requireAuth(caller);
    let key = makeRecipientKey(snapId, caller);
    switch (snapRecipients.get(key)) {
      case (?sr) {
        let snap = switch (snaps.get(snapId)) {
          case (?s) { s };
          case (null) { Runtime.trap("Snap not found") };
        };
        if (isBlocked(caller, snap.sender) or isBlocked(snap.sender, caller)) {
          Runtime.trap("Cannot view this snap");
        };
        if (sr.viewedAt != null) {
          Runtime.trap("Snap already viewed");
        };
        let blob = switch (snap.mediaBlob) {
          case (?b) { b };
          case (null) { Runtime.trap("Snap media already deleted") };
        };
        snapRecipients.add(
          key,
          {
            snapId = sr.snapId;
            recipient = sr.recipient;
            viewedAt = ?Time.now();
          },
        );
        if (allRecipientsViewed(snapId)) {
          clearSnapMedia(snapId);
        };
        {
          mediaBlob = blob;
          mediaType = snap.mediaType;
          expirationSeconds = snap.expirationSeconds;
        };
      };
      case (null) {
        Runtime.trap("Not a recipient of this snap");
      };
    };
  };

  public shared ({ caller }) func postStory(
    mediaBlob : Storage.ExternalBlob,
    mediaType : Text,
  ) : async () {
    requireAuth(caller);
    validateMedia(mediaBlob, mediaType);
    enforceLimit(countUserStories(caller), maxStoriesPerUser, "active stories");
    let id = nextStoryId;
    nextStoryId += 1;
    stories.add(
      id,
      {
        id;
        author = caller;
        mediaBlob;
        mediaType;
        createdAt = Time.now();
      },
    );
    cleanupOldStories();
  };

  public query ({ caller }) func getFriendsStories() : async [StoryView] {
    requireAuth(caller);
    let now = Time.now();
    let result = List.empty<StoryView>();
    for ((_, story) in stories.entries()) {
      if (now - story.createdAt < twentyFourHoursNs) {
        if (story.author == caller or areFriends(caller, story.author)) {
          let (name, username) = getProfileInfo(story.author);
          result.add({
            storyId = story.id;
            author = story.author;
            authorName = name;
            authorUsername = username;
            mediaType = story.mediaType;
            createdAt = story.createdAt;
          });
        };
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public query ({ caller }) func getStoryMedia(storyId : Nat) : async StoryMediaResult {
    requireAuth(caller);
    switch (stories.get(storyId)) {
      case (?story) {
        if (story.author != caller and not areFriends(caller, story.author)) {
          Runtime.trap("Not authorized to view this story");
        };
        let now = Time.now();
        if (now - story.createdAt >= twentyFourHoursNs) {
          Runtime.trap("Story has expired");
        };
        {
          mediaBlob = story.mediaBlob;
          mediaType = story.mediaType;
        };
      };
      case (null) {
        Runtime.trap("Story not found");
      };
    };
  };

  public query ({ caller }) func getMyStories() : async [StoryView] {
    requireAuth(caller);
    let now = Time.now();
    let result = List.empty<StoryView>();
    for ((_, story) in stories.entries()) {
      if (story.author == caller and now - story.createdAt < twentyFourHoursNs) {
        let (name, username) = getProfileInfo(caller);
        result.add({
          storyId = story.id;
          author = caller;
          authorName = name;
          authorUsername = username;
          mediaType = story.mediaType;
          createdAt = story.createdAt;
        });
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public shared ({ caller }) func deleteStory(storyId : Nat) : async () {
    requireAuth(caller);
    switch (stories.get(storyId)) {
      case (?story) {
        if (story.author != caller) {
          Runtime.trap("Not authorized to delete this story");
        };
        stories.remove(storyId);
      };
      case (null) {
        Runtime.trap("Story not found");
      };
    };
  };

  public query ({ caller }) func getStreaks() : async [StreakView] {
    requireAuth(caller);
    let today = utcDay(Time.now());
    let result = List.empty<StreakView>();
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and areFriends(caller, principal)) {
        let (count, isAtRisk, lastExchangeAt) = getActiveStreak(caller, principal, today);
        if (count > 0) {
          result.add({
            friendPrincipal = principal;
            friendName = profile.name;
            friendUsername = profile.username;
            count;
            lastExchangeAt;
            isAtRisk;
          });
        };
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getChatList() : async [ChatListItem] {
    requireAuth(caller);
    let now = Time.now();
    let today = utcDay(now);

    // Single pass through snapRecipients to build per-friend activity
    let activityMap = Map.empty<Text, ChatFriendActivity>();

    for ((_, sr) in snapRecipients.entries()) {
      switch (snaps.get(sr.snapId)) {
        case (?snap) {
          // Received snap
          if (sr.recipient == caller and snap.sender != caller and not isBlocked(caller, snap.sender) and not isBlocked(snap.sender, caller) and (areFriends(caller, snap.sender) or hasInteraction(caller, snap.sender))) {
            let key = snap.sender.toText();
            let cur = getActivity(activityMap, key);
            if (sr.viewedAt == null) {
              let isOlder = switch (cur.oldestUnviewedId) {
                case (null) { true };
                case (?existingId) { snap.id < existingId };
              };
              activityMap.add(
                key,
                {
                  oldestUnviewedId = if (isOlder) { ?snap.id } else {
                    cur.oldestUnviewedId;
                  };
                  latestUnviewedAt = if (snap.createdAt > cur.latestUnviewedAt) {
                    snap.createdAt;
                  } else { cur.latestUnviewedAt };
                  unviewedCount = cur.unviewedCount + 1;
                  latestReceivedViewedAt = cur.latestReceivedViewedAt;
                  latestSentDeliveredAt = cur.latestSentDeliveredAt;
                  latestSentOpenedAt = cur.latestSentOpenedAt;
                },
              );
            } else {
              if (snap.createdAt > cur.latestReceivedViewedAt) {
                activityMap.add(
                  key,
                  {
                    oldestUnviewedId = cur.oldestUnviewedId;
                    latestUnviewedAt = cur.latestUnviewedAt;
                    unviewedCount = cur.unviewedCount;
                    latestReceivedViewedAt = snap.createdAt;
                    latestSentDeliveredAt = cur.latestSentDeliveredAt;
                    latestSentOpenedAt = cur.latestSentOpenedAt;
                  },
                );
              };
            };
          };
          // Sent snap
          if (snap.sender == caller and sr.recipient != caller and not isBlocked(caller, sr.recipient) and not isBlocked(sr.recipient, caller) and (areFriends(caller, sr.recipient) or hasInteraction(caller, sr.recipient))) {
            let key = sr.recipient.toText();
            let cur = getActivity(activityMap, key);
            if (sr.viewedAt != null) {
              if (snap.createdAt > cur.latestSentOpenedAt) {
                activityMap.add(
                  key,
                  {
                    oldestUnviewedId = cur.oldestUnviewedId;
                    latestUnviewedAt = cur.latestUnviewedAt;
                    unviewedCount = cur.unviewedCount;
                    latestReceivedViewedAt = cur.latestReceivedViewedAt;
                    latestSentDeliveredAt = cur.latestSentDeliveredAt;
                    latestSentOpenedAt = snap.createdAt;
                  },
                );
              };
            } else {
              if (snap.createdAt > cur.latestSentDeliveredAt) {
                activityMap.add(
                  key,
                  {
                    oldestUnviewedId = cur.oldestUnviewedId;
                    latestUnviewedAt = cur.latestUnviewedAt;
                    unviewedCount = cur.unviewedCount;
                    latestReceivedViewedAt = cur.latestReceivedViewedAt;
                    latestSentDeliveredAt = snap.createdAt;
                    latestSentOpenedAt = cur.latestSentOpenedAt;
                  },
                );
              };
            };
          };
        };
        case (null) {};
      };
    };

    // Build chat list for friends and users with snap interactions
    let result = List.empty<ChatListItem>();
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and not isBlocked(caller, principal) and not isBlocked(principal, caller) and (areFriends(caller, principal) or hasInteraction(caller, principal))) {
        let key = principal.toText();
        var actType = "none";
        var actAt : Int = 0;
        var snapId : ?Nat = null;
        var snapCount : Nat = 0;

        switch (activityMap.get(key)) {
          case (?data) {
            if (data.unviewedCount > 0) {
              actType := "received_new";
              actAt := data.latestUnviewedAt;
              snapId := data.oldestUnviewedId;
              snapCount := data.unviewedCount;
            } else {
              if (data.latestReceivedViewedAt > actAt) {
                actAt := data.latestReceivedViewedAt;
                actType := "received_opened";
              };
              if (data.latestSentOpenedAt > actAt) {
                actAt := data.latestSentOpenedAt;
                actType := "sent_opened";
              };
              if (data.latestSentDeliveredAt > actAt) {
                actAt := data.latestSentDeliveredAt;
                actType := "sent_delivered";
              };
            };
          };
          case (null) {};
        };

        let (sCount, sAtRisk, _) = getActiveStreak(caller, principal, today);

        result.add({
          friendPrincipal = principal;
          friendName = profile.name;
          friendUsername = profile.username;
          lastActivityAt = actAt;
          lastActivityType = actType;
          unviewedSnapId = snapId;
          unviewedSnapCount = snapCount;
          streakCount = sCount;
          streakAtRisk = sAtRisk;
          isFriend = areFriends(caller, principal);
        });
      };
    };

    // Sort by activity time descending (no-activity friends go to end)
    result.sortInPlace(func(a, b) { Int.compare(b.lastActivityAt, a.lastActivityAt) });
    result.toArray();
  };

  public query ({ caller }) func getConversation(friend : Principal) : async [ConversationItem] {
    requireAuth(caller);
    if (not areFriends(caller, friend) and not hasInteraction(caller, friend)) {
      Runtime.trap("No conversation with this user");
    };
    if (isBlocked(caller, friend) or isBlocked(friend, caller)) {
      Runtime.trap("Cannot view this conversation");
    };
    let result = List.empty<ConversationItem>();
    for ((_, sr) in snapRecipients.entries()) {
      switch (snaps.get(sr.snapId)) {
        case (?snap) {
          // Received snap from friend
          if (snap.sender == friend and sr.recipient == caller) {
            let status = if (sr.viewedAt != null) { "opened" } else { "new" };
            result.add({
              snapId = snap.id;
              sender = snap.sender;
              status;
              createdAt = snap.createdAt;
              expirationSeconds = snap.expirationSeconds;
            });
          };
          // Sent snap to friend
          if (snap.sender == caller and sr.recipient == friend) {
            let status = if (sr.viewedAt != null) { "opened" } else {
              "delivered";
            };
            result.add({
              snapId = snap.id;
              sender = snap.sender;
              status;
              createdAt = snap.createdAt;
              expirationSeconds = snap.expirationSeconds;
            });
          };
        };
        case (null) {};
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(a.createdAt, b.createdAt) });
    result.toArray();
  };

  // Groups

  public query ({ caller }) func getGroups() : async [GroupView] {
    requireAuth(caller);
    let groups = getUserGroups(caller);
    let result = List.empty<GroupView>();
    for ((_, group) in groups.entries()) {
      let memberViews = List.empty<UserSearchResult>();
      for (member in group.members.vals()) {
        if (areFriends(caller, member)) {
          let (name, username) = getProfileInfo(member);
          memberViews.add({ principal = member; name; username });
        };
      };
      result.add({
        id = group.id;
        name = group.name;
        members = memberViews.toArray();
        createdAt = group.createdAt;
      });
    };
    result.toArray();
  };

  public shared ({ caller }) func createGroup(name : Text, members : [Principal]) : async Nat {
    requireAuth(caller);
    validateGroupInput(caller, name, members);
    let groups = getUserGroups(caller);
    enforceLimit(groups.size(), maxGroupsPerUser, "groups");
    let id = nextGroupId;
    nextGroupId += 1;
    groups.add(id, { id; name; members; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func updateGroup(groupId : Nat, name : Text, members : [Principal]) : async () {
    requireAuth(caller);
    validateGroupInput(caller, name, members);
    let groups = getUserGroups(caller);
    switch (groups.get(groupId)) {
      case (?existing) {
        groups.add(groupId, { id = groupId; name; members; createdAt = existing.createdAt });
      };
      case (null) {
        Runtime.trap("Group not found");
      };
    };
  };

  public shared ({ caller }) func deleteGroup(groupId : Nat) : async () {
    requireAuth(caller);
    let groups = getUserGroups(caller);
    if (groups.get(groupId) == null) {
      Runtime.trap("Group not found");
    };
    ignore groups.remove(groupId);
  };

  // Report endpoints

  public shared ({ caller }) func reportUser(target : Principal) : async () {
    requireAuth(caller);
    requireValidTarget(caller, target, "report");
    if (userProfiles.get(target) == null) {
      Runtime.trap("User not found");
    };
    if (not hasSentSnap(target, caller)) {
      Runtime.trap("Can only report users who have sent you a snap");
    };
    let reports = getUserReports(caller);
    if (reports.get(target) != null) {
      Runtime.trap("Already reported this user");
    };
    enforceLimit(reports.size(), maxReportsPerUser, "active reports");
    reports.add(target, true);
    let currentCount = switch (reportCounts.get(target)) {
      case (?c) { c };
      case (null) { 0 };
    };
    let newCount = currentCount + 1;
    reportCounts.add(target, newCount);
    if (newCount >= reportThreshold and restricted.get(target) == null) {
      restricted.add(target, true);
      restrictionNotified.remove(target);
    };
  };

  public shared ({ caller }) func withdrawReport(target : Principal) : async () {
    requireAuth(caller);
    let reports = getUserReports(caller);
    if (reports.get(target) == null) {
      Runtime.trap("No active report against this user");
    };
    ignore reports.remove(target);
    let currentCount = switch (reportCounts.get(target)) {
      case (?c) { c };
      case (null) { 0 };
    };
    if (currentCount > 0) {
      let newCount = currentCount - 1;
      reportCounts.add(target, newCount);
      if (newCount < reportThreshold and restricted.get(target) != null) {
        restricted.remove(target);
      };
    };
  };

  public query ({ caller }) func getMyReports() : async [Principal] {
    requireAuth(caller);
    let reports = getUserReports(caller);
    let result = List.empty<Principal>();
    for ((target, _) in reports.entries()) {
      result.add(target);
    };
    result.toArray();
  };

  public query ({ caller }) func getRestrictionStatus() : async RestrictionStatus {
    requireAuth(caller);
    {
      isRestricted = isRestricted(caller);
      notified = restrictionNotified.get(caller) != null;
    };
  };

  public shared ({ caller }) func acknowledgeRestriction() : async () {
    requireAuth(caller);
    if (not isRestricted(caller)) {
      Runtime.trap("Account is not restricted");
    };
    restrictionNotified.add(caller, true);
  };
};
