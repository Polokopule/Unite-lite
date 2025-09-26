export type Course = {
  id: string;
  title: string;
  content: string; // Changed from description to content to support rich text
  creator: string;
  price: number;
  imageUrl: string;
  imageHint: string;
};

export type Ad = {
  id:string;
  campaignName: string;
  content: string;
  creator: string;
  views: number;
};

export type User = {
  uid: string;
  email: string;
  type: 'user' | 'business';
  points: number;
};

export type PurchasedCourse = {
  id: string;
  title: string;
}
