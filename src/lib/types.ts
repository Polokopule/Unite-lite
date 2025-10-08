

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

export type Post = {
    id: string;
    creatorUid: string;
    creatorName: string;
    creatorPhotoURL: string;
    content: string;
    timestamp: number;
    likes: string[]; // Array of user UIDs
};

// Represents either a Post or an Ad in a feed
export type FeedItem = (Post & { itemType: 'post' }) | (Ad & { itemType: 'ad' });
