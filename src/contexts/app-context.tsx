
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, get, child, update } from "firebase/database";

// --- CONTEXT TYPE ---
interface AppContextType {
  user: User | null;
  courses: Course[];
  ads: Ad[];
  purchasedCourses: PurchasedCourse[];
  login: (email: string, type: 'user' | 'business') => void;
  logout: () => void;
  addCourse: (course: Omit<Course, 'id' | 'creator' | 'imageHint'>) => Promise<boolean>;
  purchaseCourse: (courseId: string) => Promise<boolean>;
  watchAd: (adId: string) => void;
  createAd: (ad: Omit<Ad, 'id' | 'creator' | 'views'>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load data from localStorage on initial load
    try {
      const storedUser = localStorage.getItem("aded_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("aded_user");
    } finally {
      setIsLoaded(true);
    }

    // Set up listeners for Courses and Ads from Firebase
    const coursesRef = ref(db, 'courses');
    const adsRef = ref(db, 'ads');

    const coursesListener = onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      const courseList: Course[] = data ? Object.values(data) : [];
      setCourses(courseList);
    });

    const adsListener = onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      const adList: Ad[] = data ? Object.values(data) : [];
      setAds(adList);
    });

    return () => {
      // Detach listeners on cleanup
      coursesListener();
      adsListener();
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("aded_user", JSON.stringify(user));
      // Load purchased courses when user logs in
      const purchasedRef = ref(db, `users/${user.uid}/purchasedCourses`);
      get(purchasedRef).then((snapshot) => {
        if(snapshot.exists()){
          setPurchasedCourses(Object.values(snapshot.val()));
        } else {
          setPurchasedCourses([]);
        }
      });
    } else {
      localStorage.removeItem("aded_user");
      setPurchasedCourses([]);
    }
  }, [user]);

  const login = (email: string, type: 'user' | 'business') => {
    // In a real app, you would use Firebase Auth. Here we simulate user creation/login.
    const uid = email.replace(/[^a-zA-Z0-9]/g, ''); // simple UID generation
    const userRef = ref(db, 'users/' + uid);
    
    get(userRef).then((snapshot) => {
      let newUser: User;
      if (snapshot.exists()) {
        newUser = snapshot.val();
      } else {
        newUser = { uid, email, type, points: type === 'user' ? 100 : 500 };
        set(userRef, newUser);
      }
      setUser(newUser);
      router.push("/dashboard");
    });
  };

  const logout = () => {
    setUser(null);
    router.push("/");
  };

  const addCourse = async (courseData: Omit<Course, 'id' | 'creator' | 'imageHint'>): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    
    const courseId = `course-${Date.now()}`;
    const newCourse: Course = { 
        ...courseData, 
        id: courseId,
        creator: user.email,
        imageHint: "new course" // Placeholder hint
    };

    try {
        await set(ref(db, `courses/${courseId}`), newCourse);
        return true;
    } catch(e) {
        console.error("Firebase write error:", e);
        return false;
    }
  };

  const purchaseCourse = async (courseId: string): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    const course = courses.find(c => c.id === courseId);
    if (!course || user.points < course.price || purchasedCourses.some(p => p.id === courseId)) return false;

    const updatedPoints = user.points - course.price;
    const userRef = ref(db, `users/${user.uid}`);
    const purchasedCourseRef = ref(db, `users/${user.uid}/purchasedCourses/${courseId}`);

    try {
        await update(userRef, { points: updatedPoints });
        await set(purchasedCourseRef, { id: course.id, title: course.title });
        
        setUser({ ...user, points: updatedPoints }); // Update local state
        setPurchasedCourses(prev => [...prev, { id: course.id, title: course.title }]);
        return true;
    } catch (e) {
        console.error("Firebase purchase error:", e);
        return false;
    }
  };
  
  const watchAd = async (adId: string) => {
    if (!user || user.type !== 'user') return;
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;

    const pointsEarned = 10;
    const userRef = ref(db, `users/${user.uid}`);
    const adRef = ref(db, `ads/${adId}`);

    try {
        // Update user points
        const updatedUserPoints = user.points + pointsEarned;
        await update(userRef, { points: updatedUserPoints });
        setUser({ ...user, points: updatedUserPoints }); // Update local state

        // Update ad views
        await update(adRef, { views: ad.views + 1 });

        // Update business owner points
        const businessOwnerUid = ad.creator.replace(/[^a-zA-Z0-9]/g, '');
        const businessUserRef = ref(db, `users/${businessOwnerUid}`);
        const businessSnapshot = await get(businessUserRef);
        if(businessSnapshot.exists()){
            const businessUser = businessSnapshot.val();
            await update(businessUserRef, {points: businessUser.points + 1});
        }
    } catch (e) {
        console.error("Firebase ad watch error:", e);
    }
  };

  const createAd = async (adData: Omit<Ad, 'id' | 'creator' | 'views'>): Promise<boolean> => {
    if (!user || user.type !== 'business') return false;
    const payment = 50;
    if (user.points < payment) return false;

    // --- Optimistic Update ---
    const updatedPoints = user.points - payment;
    const originalUser = user;
    setUser({ ...user, points: updatedPoints }); // 1. Update local state immediately

    const adId = `ad-${Date.now()}`;
    const newAd: Ad = { ...adData, id: adId, creator: user.email, views: 0 };
    
    // 2. Perform database operations in the background
    try {
      const userRef = ref(db, `users/${user.uid}`);
      const adRef = ref(db, `ads/${adId}`);
      
      await Promise.all([
        update(userRef, { points: updatedPoints }),
        set(adRef, newAd)
      ]);
    } catch(e) {
        console.error("Firebase ad creation error:", e);
        // 3. Rollback on failure
        setUser(originalUser); 
        return false; // Return false to indicate failure
    }
    
    return true; // Return true immediately on the optimistic path
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
