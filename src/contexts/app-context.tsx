
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse, Post } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { ref, onValue, set, get, update, remove, push, serverTimestamp } from "firebase/database";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

// --- CONTEXT TYPE ---
interface AppContextType {
  user: User | null;
  allUsers: User[];
  firebaseUser: FirebaseUser | null;
  courses: Course[];
  ads: Ad[];
  posts: Post[];
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
  followUser: (targetUserId: string) => Promise<void>;
  unfollowUser: (targetUserId: string) => Promise<void>;
  addPost: (content: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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
        onValue(userRef, (snapshot) => {
            if(snapshot.exists()) {
                const userData = snapshot.val();
                 // Ensure photoURL is part of the user object
                const fullUserData: User = {
                    ...userData,
                    photoURL: currentFirebaseUser.photoURL || userData.photoURL || ''
                };
                setUser(fullUserData);

                 // If displayName or photoURL changed, update DB
                if (currentFirebaseUser.displayName && currentFirebaseUser.displayName !== userData.name) {
                    update(userRef, { name: currentFirebaseUser.displayName });
                }
                if (currentFirebaseUser.photoURL && currentFirebaseUser.photoURL !== userData.photoURL) {
                    update(userRef, { photoURL: currentFirebaseUser.photoURL });
                }
            }
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Set up listeners for Courses, Ads, and all Users from Firebase
    const coursesRef = ref(db, 'courses');
    const adsRef = ref(db, 'ads');
    const usersRef = ref(db, 'users');
    const postsRef = ref(db, 'posts');

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

    const usersListener = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const userList: User[] = data ? Object.values(data) : [];
        setAllUsers(userList);
    });
    
    const postsListener = onValue(postsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const postList: Post[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            likes: data[key].likes ? Object.keys(data[key].likes) : []
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postList);
    });


    return () => {
      // Detach listeners on cleanup
      unsubscribe();
      coursesListener();
      adsListener();
      usersListener();
      postsListener();
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
    if (!auth.currentUser) throw new Error("Firebase user not authenticated.");

    const { uid, displayName, photoURL } = auth.currentUser;
    const userRef = ref(db, 'users/' + uid);
    
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      const newUser: User = { 
        uid, 
        email, 
        type, 
        points: type === 'user' ? 100 : 500,
        name: displayName || email.split('@')[0],
        followers: [],
        following: [],
        photoURL: photoURL || '',
      };
      await set(userRef, newUser);
    }
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
        const updatedUserPoints = user.points + pointsEarned;
        await update(userRef, { points: updatedUserPoints });

        await update(adRef, { views: ad.views + 1 });

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

  const followUser = async (targetUserId: string) => {
    if (!user || user.uid === targetUserId) return;

    // Update current user's following list
    const currentUserRef = ref(db, `users/${user.uid}`);
    const currentUserFollowing = user.following ? [...user.following, targetUserId] : [targetUserId];
    await update(currentUserRef, { following: currentUserFollowing });

    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}`);
    const targetSnapshot = await get(targetUserRef);
    if(targetSnapshot.exists()) {
        const targetUser = targetSnapshot.val();
        const targetUserFollowers = targetUser.followers ? [...targetUser.followers, user.uid] : [user.uid];
        await update(targetUserRef, { followers: targetUserFollowers });
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    // Update current user's following list
    const currentUserRef = ref(db, `users/${user.uid}`);
    const currentUserFollowing = user.following?.filter(id => id !== targetUserId) || [];
    await update(currentUserRef, { following: currentUserFollowing });
    
    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}`);
    const targetSnapshot = await get(targetUserRef);
     if(targetSnapshot.exists()) {
        const targetUser = targetSnapshot.val();
        const targetUserFollowers = targetUser.followers?.filter((id: string) => id !== user.uid) || [];
        await update(targetUserRef, { followers: targetUserFollowers });
    }
  };

  const addPost = async (content: string): Promise<boolean> => {
      if (!user || !content.trim()) return false;
      
      try {
        const postsRef = ref(db, 'posts');
        const newPostRef = push(postsRef);
        const newPost: Omit<Post, 'id' | 'likes'> = {
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            content: content,
            timestamp: serverTimestamp() as any, // This will be converted by firebase
        };
        await set(newPostRef, newPost);
        return true;
      } catch (e) {
        return false;
      }
  };

  const likePost = async (postId: string) => {
      if (!user) return;
      const postLikeRef = ref(db, `posts/${postId}/likes/${user.uid}`);
      const post = posts.find(p => p.id === postId);

      if (post) {
        const isLiked = post.likes.includes(user.uid);
        if (isLiked) {
            await remove(postLikeRef);
        } else {
            await set(postLikeRef, true);
        }
      }
  };

  const value = {
    user,
    allUsers,
    firebaseUser,
    courses,
    ads,
    posts,
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
    followUser,
    unfollowUser,
    addPost,
    likePost,
    loading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
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
