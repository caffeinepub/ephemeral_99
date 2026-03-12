# Ephemeral

## Overview

Ephemeral is a privacy-focused media sharing app built on the Internet Computer, where users capture, edit, and share temporary photos and videos that disappear after viewing. Users authenticate with Internet Identity, add friends by username, exchange ephemeral "snaps" with configurable expiration timers, post stories visible for 24 hours, and build daily streaks. The app includes a full media editor with filters, text overlays, drawing tools, stickers, and cropping. Content is stored via blob storage and automatically cleaned up after expiration.

## Authentication

- Users authenticate via Internet Identity
- Anonymous access is not permitted for any operation
- User data is isolated by principal — users can only access their own data
- Display name and username required on first login via profile setup dialog
- Users can edit their profile at any time via a settings dropdown
- Restricted users (due to reports) are notified on login and must acknowledge the restriction

## Core Features

### User Profiles

- Display name: required, 1-100 characters
- Username: required, 3-30 characters, lowercase alphanumeric and underscores only, must be unique
- Users can update their name and username at any time (new username must be available)

### Friend System

Users can discover and connect with other users via username search:

- Search by username prefix (minimum 1 character, max 50 characters)
- Search excludes the searching user, blocked users (bidirectional), and restricted users
- Users can send friend requests to found users
- Cannot send a request to someone you've already sent to, who has sent to you, or who you're already friends with
- Friend requests can be accepted or declined by the recipient
- Friend requests can be cancelled by the sender
- Users can unfriend existing friends (removes the friendship bidirectionally)
- Maximum 5,000 friends per user
- Maximum 1,000 pending friend requests per user

### Blocking

- Users can block other users
- Blocking removes the friendship if one exists and cancels any pending friend requests between the users
- Blocked users cannot send friend requests to the blocker
- Blocked users do not appear in search results (bidirectional)
- Maximum 1,000 blocked users per user

### Snaps (Ephemeral Media)

Users can send snaps (photos or videos) to one or more friends:

- Up to 100 recipients per snap
- Image snaps have a configurable expiration timer (1-10 seconds)
- Video snaps play for their full duration (no separate expiration timer)
- Supported media types: `image/jpeg`, `image/png`, `video/webm`, `video/mp4`
- Image max size: 5 MB; video max size: 50 MB
- Maximum 10,000 snaps per user

Viewing snaps:

- Recipients see unviewed snaps in their inbox
- Opening a snap marks it as viewed and starts the expiration countdown
- Image snaps auto-close after the expiration timer runs out
- Video snaps auto-close when playback ends
- A progress bar shows remaining time/playback
- Once all recipients have viewed a snap, its media blob is cleared from storage
- Snaps older than 7 days are automatically cleaned up

### Conversations

- Users can view a conversation history with each friend
- Conversation shows all snaps exchanged between two users (sent and received)
- Each event shows: snap ID, direction (sent/received), media type, viewed status, and timestamp
- Events are sorted by creation time (newest first)

### Chat List

The main inbox shows a list of friends with recent snap activity:

- Each row displays: friend name, username, last activity time, activity type (sent/received/viewed), unviewed snap count, and streak info
- Activity types shown with Snapchat-style status indicators (colored arrows/squares)
- Non-friends who have sent snaps also appear in the chat list

### Stories

Users can post stories visible to all their friends for 24 hours:

- Stories contain a media blob (photo or video) with the same size/type constraints as snaps
- Stories auto-expire after 24 hours
- Users can view their own stories and friends' stories
- Users can delete their own stories
- Story viewer supports tap-to-advance (right 2/3) and tap-to-go-back (left 1/3)
- Stories from the same user are grouped and auto-advance with a 5-second timer for images
- Video stories play for their full duration
- Maximum 10,000 stories per user

### Streaks

A streak is maintained when two friends exchange snaps on consecutive UTC days:

- Both users must send at least one snap to each other within a UTC day to maintain the streak
- Streak count increments each day both users exchange snaps
- Streaks are "at risk" when no exchange has happened today but the streak is still valid from yesterday
- Streak data is displayed in the chat list with a fire emoji and count
- At-risk streaks show a warning indicator

### Groups

Users can create named groups of friends for quick multi-recipient selection when sending snaps:

- Group name: 1-50 characters
- Minimum 2 members, maximum 100 members per group
- All group members must be friends of the creator
- Cannot add yourself to a group; no duplicate members allowed
- Maximum 100 groups per user
- Groups can be edited (rename, add/remove members) and deleted by the creator
- Groups appear in the recipient selector when sending snaps

### Reporting & Moderation

- Users can report other users (one report per reporter-target pair)
- Users can withdraw their own reports
- When a user accumulates 3 or more unique reports, they become restricted
- Restricted users cannot send friend requests and do not appear in search results
- Restricted users are notified of their restriction on login and must acknowledge it
- Maximum 1,000 reports per user (as reporter)

### Screenshot Detection

- When viewing a snap or story, the app monitors for screenshot attempts (keyboard shortcuts like Cmd+Shift+3/4, PrintScreen)
- If a screenshot is detected, the media is hidden behind a blur overlay
- The snap/story timer pauses during the screenshot alert
- User must click to dismiss the alert and resume viewing

## Backend Data Storage

- **userProfiles**: `Map<Principal, Profile>` — name and username per user
- **usernameIndex**: `Map<Text, Principal>` — reverse lookup for username uniqueness
- **friends**: `Map<Text, Bool>` — bidirectional friendship pairs
- **friendRequests**: `Map<Nat, FriendRequest>` — pending friend requests with auto-incrementing IDs
- **blocked**: `Map<Text, Bool>` — block pairs
- **snaps**: `Map<Nat, Snap>` — all snaps with auto-incrementing IDs
- **snapRecipients**: `Map<Text, SnapRecipient>` — per-recipient delivery and view tracking
- **stories**: `Map<Nat, Story>` — all stories with auto-incrementing IDs
- **streaks**: `Map<Text, StreakData>` — streak tracking between friend pairs
- **userGroups**: `Map<Principal, Map<Nat, Group>>` — per-user groups with auto-incrementing IDs
- **reportedBy**: `Map<Text, Bool>` — report pairs
- **reportCounts**: `Map<Principal, Nat>` — total report count per target
- **restricted**: `Map<Principal, RestrictionInfo>` — restriction status with notification tracking

All state persists across canister upgrades via orthogonal persistence.

## Backend Operations

- All operations require Internet Identity authentication (traps for anonymous callers)
- User data isolation is implicit via per-principal maps
- Input validation:
  - Username format (lowercase alphanumeric + underscore, 3-30 characters)
  - Name length (1-100 characters)
  - Media type and size constraints
  - Friend/group membership checks
  - Duplicate prevention for friend requests, reports, usernames
- Media stored via blob storage with automatic cleanup when all recipients have viewed
- Lazy cleanup of old snaps (7+ days) during write operations
- Stories filtered by 24-hour expiry at query time
- Error handling via `Runtime.trap()` with descriptive messages
- Blob storage managed by Caffeine infrastructure with automatic GC for orphaned blobs

## User Interface

### Layout

- **Mobile**: Single-panel layout with compact top bar (settings dropdown, friends button with badge, camera button)
- **Desktop**: Two-panel layout — left sidebar (320px) with chat list, right main panel with active view
- Views: inbox, camera, media editor, recipient selector, friends management, conversation

### Camera

- Full-screen camera viewfinder with live preview
- Tap to capture photo, long-press (300ms) to record video
- Video recording up to 60 seconds with progress ring indicator
- Front/back camera toggle (shown only when multiple cameras detected)
- Real-time filter preview strip (9 presets: Normal, B&W, Sepia, Warm, Cool, Contrast, Vintage, Noir, Fade)
- Gallery import button for selecting existing photos/videos
- Graceful error handling for camera permission denied, not found, or unsupported

### Media Editor

- **Filters**: 9 CSS filter presets with thumbnail previews
- **Text overlays**: Tap to add text, draggable positioning, customizable color (10 colors) and font size (12-48px)
- **Drawing**: Freehand drawing with customizable color and brush size (2-16px), undo and clear support
- **Stickers**: 40 emoji stickers, placed as text items
- **Cropping**: Interactive crop overlay with aspect ratio presets (Free, 1:1, 4:3, 16:9, 9:16), apply and reset
- Video export with progress indicator
- Tool switching via bottom toolbar

### Snap Viewer

- Full-screen black overlay dialog
- Progress bar showing remaining time
- Close button in top-right corner
- Screenshot detection overlay with blur

### Story Bar & Viewer

- Horizontal scrollable story bar at top of inbox
- Circular avatars with gradient ring for unviewed stories
- "My Story" always first, with "+" indicator if no stories posted
- Full-screen story viewer with segmented progress bars
- Author name and time remaining displayed
- Tap navigation between stories

### Friends Management

- Tabbed view: Friends list, Incoming/Outgoing requests
- User search dialog for finding new friends by username
- Friend cards with unfriend, block, and report actions
- Request cards with accept/decline/cancel actions
- Streak display on friend cards

### Conversations

- Chat-style view showing snap exchange history with a friend
- Snapchat-style status indicators (colored arrows for sent, squares for received)
- Quick-snap camera button within conversation

## Design System

- Light and dark theme support via `next-themes`
- Snapchat-inspired color palette for status indicators (red, purple, gray, blue)
- shadcn/ui component library (Button, Dialog, AlertDialog, Avatar, Badge, Checkbox, Slider, ScrollArea, Progress, DropdownMenu, Skeleton, Tabs)
- Sonner toast notifications (bottom-right position)
- Responsive design with mobile/desktop layout switching
- Safe area inset support for mobile devices
- Skeleton loading states for async content

## Error Handling

- **Authentication errors**: "Not authenticated" for anonymous callers
- **Self-action errors**: "Cannot [action] yourself" for self-targeting operations (friend request, block, report)
- **Not found errors**: "Friend request not found", "Snap not found", "Group not found"
- **Authorization errors**: "Not authorized" for accessing others' resources
- **Validation errors**: Invalid username format, name too long/empty, unsupported media type, media too large
- **Duplicate errors**: "Username already taken", "Already friends", "Friend request already exists"
- **Capacity errors**: "Too many friends (max 5000)", "Too many snaps (max 10000)", "Too many groups (max 100)"
- **Restriction errors**: "Your account is restricted" for restricted users attempting friend requests
- Frontend error handling: all queries render `isError` state, mutations use `onError` with toast notifications, loading states on all async buttons
