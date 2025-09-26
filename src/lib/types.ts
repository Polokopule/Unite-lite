export type Course = {
  id: string;
  title: string;
  description: string;
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
  email: string;
  type: 'user' | 'business';
  points: number;
};

export type PurchasedCourse = {
  id: string;
  title: string;
}
