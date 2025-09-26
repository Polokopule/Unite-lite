"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

// --- MOCK DATA ---
const initialCourses: Course[] = [
  { id: '1', title: 'Introduction to Web Development', description: 'Learn the basics of HTML, CSS, and JavaScript.', creator: 'Jane Doe', price: 100, imageUrl: PlaceHolderImages.find(i=>i.id==='course-1')?.imageUrl ?? '', imageHint: PlaceHolderImages.find(i=>i.id==='course-1')?.imageHint ?? '' },
  { id: '2', title: 'Advanced React Patterns', description: 'Take your React skills to the next level.', creator: 'John Smith', price: 250, imageUrl: PlaceHolderImages.find(i=>i.id==='course-2')?.imageUrl ?? '', imageHint: PlaceHolderImages.find(i=>i.id==='course-2')?.imageHint ?? '' },
  { id: '3', title: 'Digital Painting for Beginners', description: 'Unleash your creativity with digital art.', creator: 'Emily White', price: 150, imageUrl: PlaceHolderImages.find(i=>i.id==='course-3')?.imageUrl ?? '', imageHint: PlaceHolderImages.find(i=>i.id==='course-3')?.imageHint ?? '' },
];

const initialAds: Ad[] = [
  { id: 'ad1', campaignName: 'SuperNova Laptops', content: 'Experience the next generation of computing.', creator: 'business@example.com', views: 42 },
  { id: 'ad2', campaignName: 'Cosmic Coffee', content: 'The best coffee in the galaxy.', creator: 'business@example.com', views: 108 },
];

// --- CONTEXT TYPE ---
interface AppContextType {
  user: User | null;
  courses: Course[];
  ads: Ad[];
  purchasedCourses: PurchasedCourse[];
  login: (email: string, type: 'user' | 'business') => void;
  logout: () => void;
  addCourse: (course: Omit<Course, 'id' | 'creator' | 'imageUrl' | 'imageHint'>) => boolean;
  purchaseCourse: (courseId: string) => boolean;
  watchAd: (adId: string) => void;
  createAd: (ad: Omit<Ad, 'id' | 'creator' | 'views'>) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("aded_user");
      const storedPurchased = localStorage.getItem("aded_purchased_courses");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedPurchased) {
        setPurchasedCourses(JSON.parse(storedPurchased));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      localStorage.removeItem("aded_user");
      localStorage.removeItem("aded_purchased_courses");
    }
    setIsLoaded(true);
  }, []);
  
  const updateUserAndStorage = (updatedUser: User | null) => {
    setUser(updatedUser);
    if(updatedUser) {
      localStorage.setItem("aded_user", JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem("aded_user");
      localStorage.removeItem("aded_purchased_courses");
    }
  }

  const login = (email: string, type: 'user' | 'business') => {
    const newUser: User = { email, type, points: type === 'user' ? 100 : 500 };
    updateUserAndStorage(newUser);
    setPurchasedCourses([]);
    router.push("/dashboard");
  };

  const logout = () => {
    updateUserAndStorage(null);
    setPurchasedCourses([]);
    router.push("/");
  };

  const addCourse = (course: Omit<Course, 'id' | 'creator' | 'imageUrl' | 'imageHint'>): boolean => {
    if (!user || user.type !== 'user') return false;
    const newCourse: Course = { 
        ...course, 
        id: `course-${Date.now()}`, 
        creator: user.email,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/600/400`,
        imageHint: "new course"
    };
    setCourses(prev => [...prev, newCourse]);
    return true;
  };

  const purchaseCourse = (courseId: string): boolean => {
    if (!user || user.type !== 'user') return false;
    const course = courses.find(c => c.id === courseId);
    if (!course || user.points < course.price) return false;
    if (purchasedCourses.some(p => p.id === courseId)) return false;

    const updatedUser = { ...user, points: user.points - course.price };
    updateUserAndStorage(updatedUser);

    const newPurchases = [...purchasedCourses, { id: course.id, title: course.title }];
    setPurchasedCourses(newPurchases);
    localStorage.setItem("aded_purchased_courses", JSON.stringify(newPurchases));
    
    return true;
  };
  
  const watchAd = (adId: string) => {
    if (!user || user.type !== 'user') return;
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;

    const pointsEarned = 10;
    const updatedUser = { ...user, points: user.points + pointsEarned };
    updateUserAndStorage(updatedUser);
    
    setAds(prevAds => prevAds.map(a => a.id === adId ? { ...a, views: a.views + 1 } : a));
    
    // In a real app, you'd update the business owner's points in a database.
    // Here we just log it.
    console.log(`Ad ${adId} viewed. Business owner ${ad.creator} should get points.`);
  };

  const createAd = (ad: Omit<Ad, 'id' | 'creator' | 'views'>): boolean => {
    if (!user || user.type !== 'business') return false;
    // Simulate payment
    const payment = 50;
    if (user.points < payment) return false;

    const updatedUser = { ...user, points: user.points - payment };
    updateUserAndStorage(updatedUser);

    const newAd: Ad = { ...ad, id: `ad-${Date.now()}`, creator: user.email, views: 0 };
    setAds(prev => [...prev, newAd]);
    return true;
  };

  const value = {
    user,
    courses,
    ads,
    purchasedCourses,
    login,
    logout,
    addCourse,
    purchaseCourse,
    watchAd,
    createAd,
  };

  return (
    <AppContext.Provider value={value}>
      {isLoaded ? children : <div className="w-full h-screen flex items-center justify-center"><p>Loading...</p></div>}
    </AppContext.Provider>
  );
}

// --- HOOK ---
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
