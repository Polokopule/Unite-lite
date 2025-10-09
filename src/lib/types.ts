

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

export type User = {
  uid: string;
  email: string;
  name: string;
  type: 'user' | 'business';
  points: number;
  purchasedCourses?: { [courseId: string]: PurchasedCourse };
  createdCourses?: string[];
  createdAds?: string[];
  following?: string[];
  followers?: string[];
  photoURL?: string;
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
    type: 'new_follower' | 'new_comment' | 'new_reply' | 'post_like' | 'comment_like' | 'new_group_message';
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
};

export type LinkPreview = {
    url: string;
    title: string;
    description: string;
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
    linkPreview?: LinkPreview;
};

// Represents a message within a group chat
export type Message = {
    id: string;
    content: string;
    creatorUid: string;
    creatorName: string;
    creatorPhotoURL: string;
    timestamp: number;
    type: 'text' | 'image' | 'audio' | 'video' | 'file';
    fileUrl?: string;
    fileName?: string;
}

// Represents a user-created group
export type Group = {
    id: string;
    name: string;
    description: string;
    creatorUid: string;
    creatorName: string;
    members: string[]; // Array of user UIDs
    messages?: Message[];
    hasPin: boolean;
    pin: string | null;
}

// Represents either a Post or an Ad in a feed
export type FeedItem = Post | Ad;
