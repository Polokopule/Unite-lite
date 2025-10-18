

export type Course = {
  id: string;
  title: string;
  content: string; // Changed from description to content to support rich text
  creator: string; // user uid
  creatorName: string;
  price: number;
  imageUrl: string;
  imageHint: string;
};

export type Ad = {
  id:string;
  campaignName: string;
  content: string;
  creator: string; // user uid
  views: number;
  itemType?: 'ad';
};

export type UserPresence = {
    state: 'online' | 'offline';
    lastChanged: number;
}

export type Part = {
  text: string;
};

export type AIChatMessage = {
  role: 'user' | 'model';
  parts: Part[];
};

export type WithdrawalRequest = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    points: number;
    amountZAR: number;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: number;
    processedAt?: number;
};

export type User = {
  uid: string;
  email: string;
  name: string;
  type: 'user' | 'business';
  points: number; // Can be float for UPs
  purchasedCourses?: { [courseId: string]: PurchasedCourse };
  createdCourses?: string[];
  createdAds?: string[];
  following?: string[];
  followers?: string[];
  photoURL?: string;
  conversationIds?: { [id: string]: boolean };
  presence?: UserPresence;
  deletedConversations?: { [id: string]: boolean };
  pinnedConversations?: { [id: string]: number };
  lockedConversations?: { [id: string]: string }; // id: pin
  blockedUsers?: string[];
  aiChatHistory?: AIChatMessage[];
  fcmTokens?: { [token: string]: boolean };
  theme?: 'light' | 'dark';
  lastAdClaim?: number;
  withdrawalRequests?: { [requestId: string]: WithdrawalRequest };
};

export type PurchasedCourse = {
  id: string;
  title: string;
}

export type Notification = {
    id: string;
    recipientUid: string;
    actorUid: string;
    actorName: string;
    actorPhotoURL?: string;
    type: 'new_follower' | 'new_comment' | 'new_reply' | 'post_like' | 'comment_like' | 'new_group_message' | 'new_direct_message' | 'mention' | 'repost' | 'withdrawal_request' | 'withdrawal_approved' | 'withdrawal_rejected';
    targetUrl: string; // e.g., /posts/post-123#comment-456
    targetId: string; // e.g., post-123
    isRead: boolean;
    timestamp: number;
    message?: string; // Optional message, e.g., "sent a message in 'Study Group'"
}

export type Comment = {
    id: string;
    creatorUid: string;
    creatorName: string;
    creatorPhotoURL: string;
    content: string;
    timestamp: number;
    likes: string[]; // Array of user UIDs who liked the comment
    parentId: string | null; // ID of the parent comment if it's a reply
    postId: string; // ID of the post it belongs to
    linkPreview?: LinkPreview | null;
};

export type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
};

export type Post = {
    id: string;
    creatorUid: string;
    creatorName: string;
    creatorPhotoURL: string;
    content: string;
    timestamp: number;
    likes: string[]; // Array of user UIDs
    comments?: Comment[];
    itemType?: 'post';
    fileUrl?: string;
    fileName?: string;
    fileType?: 'image' | 'audio' | 'video' | 'file';
    linkPreview?: LinkPreview | null;
    repostedFrom?: {
        creatorName: string;
        creatorUid: string;
    } | null;
};

// Represents a message within a group chat
export type Message = {
    id: string;
    content: string;
    creatorUid: string;
    creatorName: string;
    creatorPhotoURL: string;
    timestamp: number;
    type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
    isEdited?: boolean;
    linkPreview?: LinkPreview | null;
    reactions?: { [emoji: string]: string[] }; // e.g. { '👍': ['user1', 'user2'] }
    readBy?: { [uid: string]: number };
}

export type GroupMemberInfo = {
    joinedAt: number;
    joinMethod: 'creator' | 'direct';
}

// Represents a user-created group
export type Group = {
    id: string;
    name: string;
    description: string;
    creatorUid: string;
    creatorName: string;
    members: { [uid: string]: GroupMemberInfo };
    messages?: Message[];
    hasPin: boolean;
    pin: string | null;
    typing?: { [uid: string]: boolean };
    photoURL?: string;
}

export type Conversation = {
    id: string;
    participantUids: string[];
    participants: { [uid: string]: { name: string; photoURL: string, uid: string } };
    lastMessage: Message | null;
    timestamp: number;
    messages?: Message[];
    typing?: { [uid: string]: boolean };
    pinnedBy?: { [uid: string]: boolean };
};


// Represents either a Post or an Ad in a feed
export type FeedItem = Post | Ad;
