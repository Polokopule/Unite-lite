
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, get, update, remove } from "firebase/database";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

// --- CONTEXT TYPE ---
interface AppContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  courses: Course[];
  ads: Ad[];
  purchasedCourses: PurchasedCourse[];
  login: (email: string, type: 'user' | 'business') => Promise<void>;
  logout: () => void;
  addCourse: (course: Omit<Course, 'id' | 'creator' | 'creatorName' | 'imageHint'>) => Promise<boolean>;
  updateCourse: (courseId: string, courseData: Partial<Omit<Course, 'id' | 'creator' | 'creatorName'>>) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  purchaseCourse: (courseId: string) => Promise<boolean>;
  watchAd: (adId: string) => void;
  createAd: (ad: Omit<Ad, 'id' | 'creator' | 'views'>) => Promise<boolean>;
  updateAd: (adId: string, adData: Partial<Omit<Ad, 'id' | 'creator'>>) => Promise<boolean>;
  deleteAd: (adId: string) => Promise<boolean>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      if (currentFirebaseUser) {
        // User is signed in, get their app-specific data from RTDB
        const userRef = ref(db, 'users/' + currentFirebaseUser.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUser(snapshot.val());
        }
        // If user data doesn't exist, it will be created on login/signup
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

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
      unsubscribe();
      coursesListener();
      adsListener();
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Load purchased courses when user logs in
      const purchasedRef = ref(db, `users/${user.uid}/purchasedCourses`);
      const listener = onValue(purchasedRef, (snapshot) => {
        if (snapshot.exists()) {
          setPurchasedCourses(Object.values(snapshot.val()));
        } else {
          setPurchasedCourses([]);
        }
      });
      return () => listener();
    } else {
      setPurchasedCourses([]);
    }
  }, [user]);

  const login = async (email: string, type: 'user' | 'business') => {
    // This is a simplified login/signup flow. It finds or creates a user record in RTDB.
    // This function is now more of a "post-authentication" handler.
    if (!auth.currentUser) throw new Error("Firebase user not authenticated.");

    const { uid } = auth.currentUser;
    const userRef = ref(db, 'users/' + uid);
    
    const snapshot = await get(userRef);
    let appUser: User;
    if (snapshot.exists()) {
      appUser = snapshot.val();
    } else {
      appUser = { 
        uid, 
        email, 
        type, 
        points: type === 'user' ? 100 : 500,
        name: auth.currentUser.displayName || email.split('@')[0],
      };
      await set(userRef, appUser);
    }
    setUser(appUser);
    router.push("/dashboard");
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    router.push("/");
  };

  const addCourse = async (courseData: Omit<Course, 'id' | 'creator' | 'creatorName' | 'imageHint'>): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    
    const courseId = `course-${Date.now()}`;
    const newCourse: Course = { 
        ...courseData, 
        id: courseId,
        creator: user.uid,
        creatorName: user.name,
        imageHint: "new course" // Placeholder hint
    };

    try {
        await set(ref(db, `courses/${courseId}`), newCourse);
        return true;
    } catch(e) {
        return false;
    }
  };

  const updateCourse = async (courseId: string, courseData: Partial<Omit<Course, 'id' | 'creator' | 'creatorName'>>): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    const courseRef = ref(db, `courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (courseSnapshot.exists() && courseSnapshot.val().creator === user.uid) {
        try {
            await update(courseRef, courseData);
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
  };

  const deleteCourse = async (courseId: string): Promise<boolean> => {
      if (!user || user.type !== 'user') return false;
      const courseRef = ref(db, `courses/${courseId}`);
      const courseSnapshot = await get(courseRef);

      if (courseSnapshot.exists() && courseSnapshot.val().creator === user.uid) {
          try {
              await remove(courseRef);
              // Also remove from any user's purchased list? - for now, no.
              return true;
          } catch(e) {
              return false;
          }
      }
      return false;
  }

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
        return true;
    } catch (e) {
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
        const businessOwnerUid = ad.creator;
        const businessUserRef = ref(db, `users/${businessOwnerUid}`);
        const businessSnapshot = await get(businessUserRef);
        if(businessSnapshot.exists()){
            const businessUser = businessSnapshot.val();
            await update(businessUserRef, {points: businessUser.points + 1});
        }
    } catch (e) {
        // silently fail
    }
  };

  const createAd = async (adData: Omit<Ad, 'id' | 'creator' | 'views'>): Promise<boolean> => {
    if (!user || user.type !== 'business') return false;
    const payment = 50;
    if (user.points < payment) return false;

    const updatedPoints = user.points - payment;
    const originalUser = user;
    setUser({ ...user, points: updatedPoints });

    const adId = `ad-${Date.now()}`;
    const newAd: Ad = { ...adData, id: adId, creator: user.uid, views: 0 };
    
    try {
      const userRef = ref(db, `users/${user.uid}`);
      const adRef = ref(db, `ads/${adId}`);
      
      await Promise.all([
        update(userRef, { points: updatedPoints }),
        set(adRef, newAd)
      ]);
    } catch(e) {
        setUser(originalUser); 
        return false;
    }
    
    return true;
  };

  const updateAd = async (adId: string, adData: Partial<Omit<Ad, 'id' | 'creator'>>): Promise<boolean> => {
      if (!user || user.type !== 'business') return false;
      const adRef = ref(db, `ads/${adId}`);
      const adSnapshot = await get(adRef);

      if (adSnapshot.exists() && adSnapshot.val().creator === user.uid) {
          try {
              await update(adRef, adData);
              return true;
          } catch(e) {
              return false;
          }
      }
      return false;
  }

  const deleteAd = async (adId: string): Promise<boolean> => {
      if (!user || user.type !== 'business') return false;
      const adRef = ref(db, `ads/${adId}`);
      const adSnapshot = await get(adRef);

      if (adSnapshot.exists() && adSnapshot.val().creator === user.uid) {
          try {
              await remove(adRef);
              return true;
          } catch(e) {
              return false;
          }
      }
      return false;
  }

  const value = {
    user,
    firebaseUser,
    courses,
    ads,
    purchasedCourses,
    login,
    logout,
    addCourse,
    updateCourse,
    deleteCourse,
    purchaseCourse,
    watchAd,
    createAd,
    updateAd,
    deleteAd,
    loading,
  };

  return (
    <AppContext.Provider value={value}>
      {loading ? <div className="w-full h-screen flex items-center justify-center"><p>Loading...</p></div> : children}
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
