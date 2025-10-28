

"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse, Post, Group, Comment, Message, Notification, LinkPreview, Conversation, WithdrawalRequest } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { ref, onValue, set, get, update, remove, push, serverTimestamp, query, orderByChild, equalTo } from "firebase/database";
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile as updateFirebaseProfile, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase"; // Import app
import toast from 'react-hot-toast';
import { getLinkPreview } from "@/ai/flows/get-link-preview-flow";

type AddCourseData = {
    title: string;
    content: string;
    price: number;
    coverImageFile: File | null;
    coverImageUrl: string;
};

type AddPostData = {
    content: string;
    repostedFrom?: { creatorUid: string; creatorName: string } | null;
    file?: File | null; // For new file uploads
    fileUrl?: string; // For reposting existing media
    fileName?: string;
    fileType?: 'image' | 'audio' | 'video' | 'file';
    linkPreview?: LinkPreview | null;
};

// --- For WebView Bridge ---
declare global {
  interface Window {
    AndroidBridge?: {
      postMessage: (message: string) => void;
    };
  }
}

// --- CONTEXT TYPE ---
interface AppContextType {
  user: User | null;
  allUsers: User[];
  firebaseUser: FirebaseUser | null;
  courses: Course[];
  ads: Ad[];
  posts: Post[];
  groups: Group[];
  conversations: Conversation[];
  purchasedCourses: PurchasedCourse[];
  notifications: Notification[];
  login: (email: string, type: 'user' | 'business') => Promise<void>;
  logout: () => void;
  updateUserProfile: (name: string, photoFile: File | null) => Promise<boolean>;
  enableNotifications: () => Promise<void>;
  addCourse: (courseData: AddCourseData) => Promise<boolean>;
  updateCourse: (courseId: string, courseData: Partial<Omit<Course, 'id' | 'creator' | 'creatorName'>>, coverImageFile: File | null) => Promise<boolean>;
  deleteCourse: (courseId: string, isAdmin?: boolean) => Promise<boolean>;
  purchaseCourse: (course: Course) => Promise<boolean>;
  claimAdPoints: () => Promise<void>;
  createAd: (ad: Omit<Ad, 'id' | 'creator' | 'views'>) => Promise<boolean>;
  updateAd: (adId: string, adData: Partial<Omit<Ad, 'id' | 'creator'>>) => Promise<boolean>;
  deleteAd: (adId: string) => Promise<boolean>;
  followUser: (targetUserId: string) => Promise<void>;
  unfollowUser: (targetUserId: string) => Promise<void>;
  addPost: (postData: AddPostData) => Promise<boolean>;
  updatePost: (postId: string, postData: { content: string }) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string | null) => Promise<boolean>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<boolean>;
  createGroup: (groupData: { name: string; description: string; pin?: string, photoFile?: File | null }) => Promise<string | null>;
  updateGroup: (groupId: string, groupData: { name: string; description: string }, photoFile: File | null) => Promise<boolean>;
  updateGroupPin: (groupId: string, pin: string) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string, pin?: string) => Promise<boolean>;
  sendMessage: (groupId: string, messageData: { content?: string; file?: File; type?: 'system' | 'text' }) => Promise<boolean>;
  editMessage: (groupId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (groupId: string, messageId: string) => Promise<boolean>;
  reactToMessage: (groupId: string, messageId: string, reaction: string) => Promise<void>;
  startConversation: (otherUserId: string) => Promise<string | null>;
  sendDirectMessage: (conversationId: string, messageData: { content?: string, file?: File }) => Promise<boolean>;
  editDirectMessage: (conversationId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteDirectMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  reactToDirectMessage: (conversationId: string, messageId: string, reaction: string) => Promise<void>;
  getConversationById: (conversationId: string) => Conversation | undefined;
  markNotificationsAsRead: () => Promise<void>;
  markMessagesAsRead: (id: string, isDirect?: boolean) => void;
  updateTypingStatus: (id: string, isTyping: boolean, isDirect?: boolean) => void;
  togglePinConversation: (conversationId: string) => void;
  deleteConversationForUser: (conversationId: string) => void;
  lockConversation: (conversationId: string, pin: string) => void;
  unlockConversation: (conversationId: string) => void;
  toggleBlockUser: (targetUserId: string) => void;
  updateThemePreference: (theme: 'light' | 'dark') => Promise<void>;
  requestWithdrawal: (amount: number, method: 'Mpesa' | 'Skrill', paymentDetail: string) => Promise<void>;
  approveWithdrawal: (request: WithdrawalRequest) => Promise<void>;
  rejectWithdrawal: (request: WithdrawalRequest) => Promise<void>;
  toggleUserBan: (userId: string, ban: boolean) => Promise<void>;
  rateCourse: (courseId: string, rating: number) => Promise<void>;
  lockedConversations: { [id: string]: string };
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedConversations, setLockedConversations] = useState<{ [id: string]: string }>({});
  const router = useRouter();

  const urlRegex = /(https?:\/\/[^\s"'<>()\[\]{}]+)/g;

  // --- WebView Bridge ---
  const postToWebView = (notification: {title: string, body: string, url: string}) => {
    if (window.AndroidBridge && typeof window.AndroidBridge.postMessage === 'function') {
      try {
        window.AndroidBridge.postMessage(JSON.stringify(notification));
      } catch (e) {
        console.error("Error posting message to Android Bridge", e);
      }
    }
  }

  useEffect(() => {
    // Load locked conversations from local storage
    const storedLocks = localStorage.getItem('lockedConversations');
    if (storedLocks) {
      setLockedConversations(JSON.parse(storedLocks));
    }

    const initializeAuth = async () => {
        // This is the line that enables login persistence in IndexedDB
        await setPersistence(auth, browserLocalPersistence);
        const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
            setFirebaseUser(currentFirebaseUser);
            if (currentFirebaseUser) {
                const userRef = ref(db, 'users/' + currentFirebaseUser.uid);
                onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        if (userData.banned) {
                            toast.error("This account has been banned.");
                            signOut(auth);
                            setUser(null);
                            setFirebaseUser(null);
                            router.push('/');
                            return;
                        }

                        const fullUserData: User = {
                            ...userData,
                            photoURL: currentFirebaseUser.photoURL || userData.photoURL || '',
                            followers: userData.followers ? Object.keys(userData.followers) : [],
                            following: userData.following ? Object.keys(userData.following) : [],
                            blockedUsers: userData.blockedUsers ? Object.keys(userData.blockedUsers) : [],
                            withdrawalRequests: userData.withdrawalRequests || {},
                        };
                        setUser(fullUserData);

                        if (currentFirebaseUser.displayName && currentFirebaseUser.displayName !== userData.name) {
                            update(userRef, { name: currentFirebaseUser.displayName });
                        }
                        if (currentFirebaseUser.photoURL && currentFirebaseUser.photoURL !== userData.photoURL) {
                            update(userRef, { photoURL: currentFirebaseUser.photoURL });
                        }
                    }
                     setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    };
    
    const unsubscribeAuth = initializeAuth();


    // Set up listeners for Courses, Ads, and all Users from Firebase
    const coursesRef = ref(db, 'courses');
    const adsRef = ref(db, 'ads');
    const usersRef = ref(db, 'users');
    const postsRef = ref(db, 'posts');
    const groupsRef = ref(db, 'groups');

    const coursesListener = onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      const courseList: Course[] = data ? Object.keys(data).map(id => ({ ...data[id], id })) : [];
      setCourses(courseList);
    });

    const adsListener = onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      const adList: Ad[] = data ? Object.values(data) : [];
      setAds(adList);
    });

    const usersListener = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const userList: User[] = data ? Object.keys(data).map(uid => ({ 
            ...data[uid], 
            uid, 
            followers: data[uid].followers ? Object.keys(data[uid].followers) : [],
            following: data[uid].following ? Object.keys(data[uid].following) : [],
            blockedUsers: data[uid].blockedUsers ? Object.keys(data[uid].blockedUsers) : [] 
        })) : [];
        setAllUsers(userList);
    });
    
    const postsListener = onValue(postsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const postList: Post[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            likes: data[key].likes ? Object.keys(data[key].likes) : [],
            comments: data[key].comments ? Object.values(data[key].comments).map((c: any) => ({ ...c, likes: c.likes ? Object.keys(c.likes) : []})) : []
        })).sort((a, b) => b.timestamp - a.timestamp);
        setPosts(postList);
    });

    const groupsListener = onValue(groupsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const groupList: Group[] = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            members: data[key].members || {},
            messages: data[key].messages ? Object.values(data[key].messages).map((msg: any) => ({...msg, reactions: msg.reactions ? Object.entries(msg.reactions).reduce((acc: any, [emoji, uidsObj]: any) => ({...acc, [emoji]: Object.keys(uidsObj)}), {}) : {}})) : []
        }));
        setGroups(groupList);
    });


    return () => {
      // Detach listeners on cleanup
      unsubscribeAuth.then(unsub => unsub());
      coursesListener();
      adsListener();
      usersListener();
      postsListener();
      groupsListener();
    };
  }, []);

  useEffect(() => {
    let purchasedListener: () => void;
    let notificationsListener: () => void;
    let conversationIdsListener: () => void;
    const conversationListeners: (() => void)[] = [];

    if (user) {
        const purchasedRef = ref(db, `users/${user.uid}/purchasedCourses`);
        purchasedListener = onValue(purchasedRef, (snapshot) => {
            setPurchasedCourses(snapshot.exists() ? Object.values(snapshot.val()) : []);
        });

        const notificationsRef = query(ref(db, `notifications/${user.uid}`), orderByChild('timestamp'));
        notificationsListener = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const newNotifications: Notification[] = Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp);
            setNotifications(newNotifications);
        });

        const userConversationsRef = ref(db, `users/${user.uid}/conversationIds`);
        conversationIdsListener = onValue(userConversationsRef, (snapshot) => {
            const conversationIds = snapshot.val() || {};
            
            // Clear existing listeners
            conversationListeners.forEach(listener => listener());
            conversationListeners.length = 0;

            if (Object.keys(conversationIds).length === 0) {
              setConversations([]);
              return;
            }

            Object.keys(conversationIds).forEach(convoId => {
                const convoRef = ref(db, `conversations/${convoId}`);
                const convoListener = onValue(convoRef, (convoSnapshot) => {
                    if (convoSnapshot.exists()) {
                        const convoData = { id: convoId, ...convoSnapshot.val() };
                        const processedConvo = {
                            ...convoData,
                            participantUids: convoData.participants ? Object.keys(convoData.participants) : [],
                            messages: convoData.messages ? Object.values(convoData.messages).map((msg:any) => ({ ...msg, reactions: msg.reactions ? Object.entries(msg.reactions).reduce((acc: any, [emoji, uidsObj]: any) => ({...acc, [emoji]: Object.keys(uidsObj) }), {}) : {} })) : []
                        };
                        
                        // Update or add the conversation in the state
                        setConversations(prevConvos => {
                            const existingIndex = prevConvos.findIndex(c => c.id === convoId);
                            let newConvos = [...prevConvos];
                            if (existingIndex > -1) {
                                newConvos[existingIndex] = processedConvo;
                            } else {
                                newConvos.push(processedConvo);
                            }
                            return newConvos.sort((a, b) => {
                              const aPinned = a.pinnedBy && a.pinnedBy[user.uid];
                              const bPinned = b.pinnedBy && b.pinnedBy[user.uid];
                              if (aPinned && !bPinned) return -1;
                              if (!aPinned && bPinned) return 1;
                              return (b.lastMessage?.timestamp || b.timestamp) - (a.lastMessage?.timestamp || a.timestamp);
                            });
                        });
                    }
                });
                conversationListeners.push(convoListener);
            });
        });
        conversationListeners.push(conversationIdsListener);

    } else {
        setPurchasedCourses([]);
        setNotifications([]);
        setConversations([]);
    }

    return () => {
        if (purchasedListener) purchasedListener();
        if (notificationsListener) notificationsListener();
        if (conversationIdsListener) conversationIdsListener();
        conversationListeners.forEach(l => l());
    };
}, [user]);


  const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
      const notificationRef = ref(db, `notifications/${notification.recipientUid}`);
      const newNotificationRef = push(notificationRef);
      const newNotification: Omit<Notification, 'id'> = {
          ...notification,
          recipientUid: notification.recipientUid,
          id: newNotificationRef.key!,
          isRead: false,
          timestamp: serverTimestamp() as any
      }
      await set(newNotificationRef, newNotification);
  }

  const login = async (email: string, type: 'user' | 'business') => {
    if (!auth.currentUser) throw new Error("Firebase user not authenticated.");

    const { uid, displayName, photoURL } = auth.currentUser;
    const userRef = ref(db, 'users/' + uid);
    
    await setPersistence(auth, browserLocalPersistence);

    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      const newUser: User = { 
        uid, 
        email, 
        type, 
        points: 10,
        name: displayName || email.split('@')[0],
        followers: [],
        following: [],
        photoURL: photoURL || '',
        theme: 'light',
      };
      await set(userRef, newUser);
    } else {
        const userData = snapshot.val();
        if (userData.banned) {
            toast.error("This account has been banned.");
            await signOut(auth);
            return;
        }
    }
    router.push("/");
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    router.push("/");
  };
  
    const updateUserProfile = async (name: string, photoFile: File | null): Promise<boolean> => {
        if (!firebaseUser) return false;

        try {
            const updates: { displayName?: string, photoURL?: string } = {};
            let photoURL = firebaseUser.photoURL;

            if (photoFile) {
                const photoStorageRef = storageRef(storage, `profile-pictures/${firebaseUser.uid}`);
                const uploadResult = await uploadBytes(photoStorageRef, photoFile);
                photoURL = await getDownloadURL(uploadResult.ref);
                updates.photoURL = photoURL;
            }

            if (name !== firebaseUser.displayName) {
                updates.displayName = name;
            }

            // Update Firebase Auth profile
            if (Object.keys(updates).length > 0) {
              await updateFirebaseProfile(firebaseUser, updates);
            }

            // Update RTDB profile
            const userDbRef = ref(db, `users/${firebaseUser.uid}`);
            await update(userDbRef, { name, photoURL });
            
            toast.success("Profile updated successfully!");
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile.");
            return false;
        }
    };
    
    const enableNotifications = async () => {
        if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            toast.error("Push messaging is not supported in this browser.");
            return;
        }

        try {
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const fcmToken = await getToken(messaging);
                if (fcmToken) {
                    const userRef = ref(db, `users/${user.uid}/fcmTokens/${fcmToken}`);
                    await set(userRef, true);
                    toast.success("Notifications enabled!");
                } else {
                     toast.error('Could not get notification token.');
                }
            } else {
                toast.error('Unable to get permission to notify.');
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
            toast.error('An error occurred while enabling notifications.');
        }
    };


  const addCourse = async (courseData: AddCourseData): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    
    const { title, content, price, coverImageFile, coverImageUrl } = courseData;
    
    const promise = async () => {
        let finalImageUrl = coverImageUrl;
        
        if (coverImageFile) {
            const imageStorageRef = storageRef(storage, `course-images/${user.uid}/${Date.now()}_${coverImageFile.name}`);
            const uploadResult = await uploadBytes(imageStorageRef, coverImageFile);
            finalImageUrl = await getDownloadURL(uploadResult.ref);
        }

        if (!finalImageUrl) {
            throw new Error("Cover image is required.");
        }

        const courseId = push(ref(db, 'courses')).key!;
        const newCourse: Omit<Course, 'id'> = {
            title,
            content,
            price,
            imageUrl: finalImageUrl,
            creator: user.uid,
            creatorName: user.name,
            imageHint: "new course",
            status: 'pending',
            ratings: {}
        };
        await set(ref(db, `courses/${courseId}`), newCourse);
        return true;
    }
    
    toast.promise(promise(), {
        loading: 'Submitting course for review...',
        success: 'Course submitted successfully!',
        error: (err) => err.message || 'Failed to create course.',
    });

    return promise().catch(() => false);
  };

  const updateCourse = async (courseId: string, courseData: Partial<Omit<Course, 'id' | 'creator' | 'creatorName'>>, coverImageFile: File | null): Promise<boolean> => {
    if (!user || (user.type !== 'user' && user.email !== 'polokopule91@gmail.com')) return false;
    const courseRef = ref(db, `courses/${courseId}`);
    
    const promise = async () => {
        const courseSnapshot = await get(courseRef);
        if (courseSnapshot.exists() && (courseSnapshot.val().creator === user.uid || user.email === 'polokopule91@gmail.com')) {
            const updates = { ...courseData };
            if (coverImageFile) {
                const imageStorageRef = storageRef(storage, `course-images/${courseId}/${coverImageFile.name}`);
                const uploadResult = await uploadBytes(imageStorageRef, coverImageFile);
                updates.imageUrl = await getDownloadURL(uploadResult.ref);
            }
            await update(courseRef, updates);
        } else {
            throw new Error("Unauthorized or course not found.");
        }
    }

    toast.promise(promise(), {
        loading: 'Saving changes...',
        success: 'Course updated successfully!',
        error: 'Failed to update course.',
    });
    
    return promise().then(() => true).catch(() => false);
  };

  const deleteCourse = async (courseId: string, isAdmin: boolean = false): Promise<boolean> => {
      if (!user) return false;
      const courseRef = ref(db, `courses/${courseId}`);
      
      const promise = async () => {
          const courseSnapshot = await get(courseRef);
          if (courseSnapshot.exists() && (courseSnapshot.val().creator === user.uid || isAdmin)) {
              await remove(courseRef);
          } else {
              throw new Error("Unauthorized or course not found.");
          }
      }

      toast.promise(promise(), {
          loading: 'Deleting course...',
          success: 'Course deleted.',
          error: 'Failed to delete course.',
      });
      
      return promise().then(() => true).catch(() => false);
  }

  const purchaseCourse = async (course: Course): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    if (user.email === 'polokopule91@gmail.com') {
      toast.success("Admin has free access.");
      return true;
    }

    const promise = async () => {
        if (!course || user.points < course.price || purchasedCourses.some(p => p.id === course.id)) {
            throw new Error("Purchase conditions not met.");
        };

        const updatedPoints = user.points - course.price;
        const userRef = ref(db, `users/${user.uid}`);
        const purchasedCourseRef = ref(db, `users/${user.uid}/purchasedCourses/${course.id}`);

        await update(userRef, { points: updatedPoints });
        await set(purchasedCourseRef, { id: course.id, title: course.title });
    };

    toast.promise(promise(), {
        loading: 'Processing purchase...',
        success: 'Course purchased successfully!',
        error: 'Purchase failed. You may not have enough points or already own this course.',
    });
    
    return promise().then(() => true).catch(() => false);
  };
  
  const claimAdPoints = async () => {
    if (!user || user.type !== 'user') return;
    const now = Date.now();
    const COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutes
    const lastClaim = user.lastAdClaim || 0;

    if (now - lastClaim < COOLDOWN_TIME) {
        toast.error(`Please wait ${Math.ceil((COOLDOWN_TIME - (now - lastClaim)) / 1000)}s`);
        return;
    }

    const pointsToEarn = 0.005;
    const userRef = ref(db, `users/${user.uid}`);
    
    try {
        const updatedPoints = (user.points || 0) + pointsToEarn;
        await update(userRef, { points: updatedPoints, lastAdClaim: now });
        toast.success(`You earned ${pointsToEarn} UPs!`);
    } catch(e) {
        toast.error("Failed to claim points.");
    }
  };

  const createAd = async (adData: Omit<Ad, 'id' | 'creator' | 'views'>): Promise<boolean> => {
    if (!user || user.type !== 'business') return false;
    const payment = 50;
    
    const promise = async () => {
        if (user.points < payment) throw new Error("Not enough points.");
        
        const updatedPoints = user.points - payment;
        const adId = `ad-${Date.now()}`;
        const newAd: Ad = { ...adData, id: adId, creator: user.uid, views: 0 };
        
        const userRef = ref(db, `users/${user.uid}`);
        const adRef = ref(db, `ads/${adId}`);
        
        await Promise.all([
            update(userRef, { points: updatedPoints }),
            set(adRef, newAd)
        ]);
    };

    toast.promise(promise(), {
        loading: 'Creating ad campaign...',
        success: 'Ad campaign created!',
        error: 'Failed to create campaign. You may not have enough points.',
    });
    
    return promise().then(() => true).catch(() => false);
  };

  const updateAd = async (adId: string, adData: Partial<Omit<Ad, 'id' | 'creator'>>): Promise<boolean> => {
      if (!user || user.type !== 'business') return false;
      
      const promise = async () => {
        const adRef = ref(db, `ads/${adId}`);
        const adSnapshot = await get(adRef);

        if (adSnapshot.exists() && adSnapshot.val().creator === user.uid) {
            await update(adRef, adData);
        } else {
            throw new Error("Unauthorized or ad not found.");
        }
      }
      
      toast.promise(promise(), {
          loading: 'Saving changes...',
          success: 'Ad campaign updated.',
          error: 'Failed to update campaign.',
      });

      return promise().then(() => true).catch(() => false);
  }

  const deleteAd = async (adId: string): Promise<boolean> => {
      if (!user || user.type !== 'business') return false;
      const promise = async () => {
        const adRef = ref(db, `ads/${adId}`);
        const adSnapshot = await get(adRef);

        if (adSnapshot.exists() && adSnapshot.val().creator === user.uid) {
            await remove(adRef);
        } else {
            throw new Error("Unauthorized or ad not found.");
        }
      }
      toast.promise(promise(), {
          loading: 'Deleting campaign...',
          success: 'Ad campaign deleted.',
          error: 'Failed to delete campaign.',
      });

      return promise().then(() => true).catch(() => false);
  }

  const followUser = async (targetUserId: string) => {
    if (!user || user.uid === targetUserId) return;

    // Update current user's following list
    const currentUserRef = ref(db, `users/${user.uid}/following/${targetUserId}`);
    await set(currentUserRef, true);

    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}/followers/${user.uid}`);
    await set(targetUserRef, true);
        
    const notificationPayload = {
        recipientUid: targetUserId,
        actorUid: user.uid,
        actorName: user.name,
        actorPhotoURL: user.photoURL,
        type: 'new_follower' as const,
        targetUrl: `/profile/${user.uid}`,
        targetId: user.uid,
        message: 'started following you.'
    };
    await createNotification(notificationPayload);

    postToWebView({
        title: user.name,
        body: 'started following you.',
        url: notificationPayload.targetUrl
    });

    toast.success(`You are now following them!`);
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    // Update current user's following list
    const currentUserRef = ref(db, `users/${user.uid}/following/${targetUserId}`);
    await remove(currentUserRef);
    
    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}/followers/${user.uid}`);
    await remove(targetUserRef);
    toast.success(`You have unfollowed them.`);
  };

    const getFileType = (file: File): 'image' | 'audio' | 'video' | 'file' => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.startsWith('video/')) return 'video';
        return 'file';
    }

    const handleMentions = async (content: string, postId: string, commentId?: string) => {
        if (!user) return;
        const mentionRegex = /@\[(.+?)\]\((.+?)\)/g;
        let match;
        const mentionedUids = new Set<string>();

        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUid = match[2];
            if (mentionedUid !== user.uid) {
                mentionedUids.add(mentionedUid);
            }
        }

        for (const uid of mentionedUids) {
            const notificationPayload = {
                recipientUid: uid,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'mention' as const,
                targetUrl: `/posts/${postId}${commentId ? `#comment-${commentId}` : ''}`,
                targetId: commentId || postId,
                message: `mentioned you in ${commentId ? 'a comment' : 'a post'}.`,
            };
            await createNotification(notificationPayload);
             postToWebView({
                title: user.name,
                body: notificationPayload.message,
                url: notificationPayload.targetUrl,
            });
        }
    };

    const addPost = async (postData: AddPostData): Promise<boolean> => {
      if (!user) {
        toast.error("You must be logged in to post.");
        return false;
      }
      const { content, file, repostedFrom } = postData;
      if (!content?.trim() && !file && !postData.fileUrl) {
          toast.error("Post cannot be empty.");
          return false;
      }

      const postsRef = ref(db, 'posts');
      const newPostRef = push(postsRef);
      const postId = newPostRef.key!;
      
      const newPost: Omit<Post, 'id' | 'likes' | 'comments'> = {
          creatorUid: user.uid,
          creatorName: user.name,
          creatorPhotoURL: user.photoURL || '',
          content: content || '',
          timestamp: serverTimestamp() as any,
          repostedFrom: repostedFrom || null,
          linkPreview: null,
      };
      
      if (file) {
          const fileStorageRef = storageRef(storage, `post-files/${postId}/${file.name}`);
          const snapshot = await uploadBytes(fileStorageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          newPost.fileUrl = downloadURL;
          newPost.fileName = file.name;
          newPost.fileType = getFileType(file);
      } else if (postData.fileUrl && postData.fileName && postData.fileType) {
          newPost.fileUrl = postData.fileUrl;
          newPost.fileName = postData.fileName;
          newPost.fileType = postData.fileType;
      }
      
      const urlMatch = content.match(urlRegex);
      if (urlMatch) {
          const preview = await getLinkPreview(urlMatch[0]);
          if(preview) newPost.linkPreview = preview;
      }

      await set(newPostRef, newPost);

      if (content) {
          await handleMentions(content, postId);
      }
      
      if (repostedFrom && repostedFrom.creatorUid !== user.uid) {
          const notificationPayload = {
              recipientUid: repostedFrom.creatorUid,
              actorUid: user.uid,
              actorName: user.name,
              actorPhotoURL: user.photoURL,
              type: 'repost' as const,
              targetUrl: `/posts/${postId}`,
              targetId: postId,
              message: "reposted your post.",
          };
          await createNotification(notificationPayload);
          postToWebView({
              title: user.name,
              body: notificationPayload.message,
              url: notificationPayload.targetUrl,
          });
      }
      return true;
  };
  
  const updatePost = async (postId: string, postData: { content: string }): Promise<boolean> => {
      if (!user) return false;
      const postRef = ref(db, `posts/${postId}`);
      const promise = async () => {
          const postSnapshot = await get(postRef);
          if (postSnapshot.exists() && postSnapshot.val().creatorUid === user.uid) {
              const urlMatch = postData.content.match(urlRegex);
              let linkPreview = null;
              if (urlMatch) {
                  linkPreview = await getLinkPreview(urlMatch[0]);
              }
              await update(postRef, { content: postData.content, linkPreview });
              await handleMentions(postData.content, postId);
          } else {
              throw new Error("Unauthorized or post not found.");
          }
      };

      toast.promise(promise(), {
          loading: 'Saving changes...',
          success: 'Post updated!',
          error: 'Failed to update post.',
      });

      return promise().then(() => true).catch(() => false);
  };
  
  const deletePost = async (postId: string): Promise<boolean> => {
      if (!user) return false;
      const postRef = ref(db, `posts/${postId}`);
      const promise = async () => {
        const postSnapshot = await get(postRef);
        if (postSnapshot.exists() && postSnapshot.val().creatorUid === user.uid) {
            await remove(postRef);
        } else {
            throw new Error("Unauthorized or post not found.");
        }
      }

      toast.promise(promise(), {
          loading: 'Deleting post...',
          success: 'Post deleted.',
          error: 'Failed to delete post.',
      });

      return promise().then(() => true).catch(() => false);
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
             if (post.creatorUid !== user.uid) {
                const notificationPayload = {
                    recipientUid: post.creatorUid,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: 'post_like' as const,
                    targetUrl: `/posts/${post.id}`,
                    targetId: postId,
                    message: "liked your post."
                };
                await createNotification(notificationPayload);
                postToWebView({
                    title: user.name,
                    body: "liked your post.",
                    url: notificationPayload.targetUrl,
                });
            }
        }
      }
  };

    const addComment = async (postId: string, content: string, parentId: string | null = null): Promise<boolean> => {
        if (!user || !content.trim()) return false;
        try {
            const postRef = ref(db, `posts/${postId}`);
            const postSnapshot = await get(postRef);
            if (!postSnapshot.exists()) {
                toast.error("Post does not exist.");
                return false;
            }

            const commentsRef = ref(db, `posts/${postId}/comments`);
            const newCommentRef = push(commentsRef);
            const commentId = newCommentRef.key!;

            const urlMatch = content.match(urlRegex);
            let linkPreview = null;
            if (urlMatch) {
                linkPreview = await getLinkPreview(urlMatch[0]);
            }

            let newComment: Omit<Comment, 'id' | 'likes'> = {
                id: commentId,
                creatorUid: user.uid,
                creatorName: user.name,
                creatorPhotoURL: user.photoURL || '',
                content: content,
                timestamp: serverTimestamp() as any,
                parentId: parentId,
                postId: postId,
                linkPreview: linkPreview,
            };
            
            await set(newCommentRef, newComment);
            toast.success("Comment added!");
            
            await handleMentions(content, postId, commentId);

            const post = posts.find(p => p.id === postId);
            if (post && post.creatorUid !== user.uid) {
                 const notificationPayload = {
                    recipientUid: post.creatorUid,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: (parentId ? 'new_reply' : 'new_comment') as 'new_reply' | 'new_comment',
                    targetUrl: `/posts/${postId}#comment-${commentId}`,
                    targetId: postId,
                    message: `commented on your post.`
                };
                await createNotification(notificationPayload);
                postToWebView({
                    title: user.name,
                    body: `commented on your post.`,
                    url: notificationPayload.targetUrl,
                });
            }
            // Also notify parent comment author if it's a reply and not their own comment
            if (parentId) {
                const parentComment = post?.comments?.find(c => c.id === parentId);
                if (parentComment && parentComment.creatorUid !== user.uid && parentComment.creatorUid !== post?.creatorUid) {
                     const replyNotificationPayload = {
                        recipientUid: parentComment.creatorUid,
                        actorUid: user.uid,
                        actorName: user.name,
                        actorPhotoURL: user.photoURL,
                        type: 'new_reply' as const,
                        targetUrl: `/posts/${postId}#comment-${commentId}`,
                        targetId: postId,
                        message: `replied to your comment.`
                    };
                    await createNotification(replyNotificationPayload);
                    postToWebView({
                        title: user.name,
                        body: `replied to your comment.`,
                        url: replyNotificationPayload.targetUrl,
                    });
                }
            }
            return true;
        } catch (e) {
            toast.error("Failed to add comment.");
            return false;
        }
    };

    const likeComment = async (postId: string, commentId: string) => {
        if (!user) return;
        const commentLikeRef = ref(db, `posts/${postId}/comments/${commentId}/likes/${user.uid}`);
        const post = posts.find(p => p.id === postId);
        const comment = post?.comments?.find(c => c.id === commentId);

        if (comment) {
            const isLiked = comment.likes.includes(user.uid);
            if (isLiked) {
                await remove(commentLikeRef);
            } else {
                await set(commentLikeRef, true);
                if (comment.creatorUid !== user.uid) {
                    const notificationPayload = {
                        recipientUid: comment.creatorUid,
                        actorUid: user.uid,
                        actorName: user.name,
                        actorPhotoURL: user.photoURL,
                        type: 'comment_like' as const,
                        targetUrl: `/posts/${postId}#comment-${commentId}`,
                        targetId: postId,
                        message: 'liked your comment.'
                    };
                    await createNotification(notificationPayload);
                    postToWebView({
                        title: user.name,
                        body: "liked your comment.",
                        url: notificationPayload.targetUrl,
                    });
                }
            }
        }
    };
    
    const deleteComment = async (postId: string, commentId: string): Promise<boolean> => {
        if (!user) return false;
        const promise = async () => {
            const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
            const commentSnapshot = await get(commentRef);
            if (commentSnapshot.exists() && commentSnapshot.val().creatorUid === user.uid) {
                await remove(commentRef);
                // Also remove replies to this comment
                const post = posts.find(p => p.id === postId);
                const replies = post?.comments?.filter(c => c.parentId === commentId) || [];
                for (const reply of replies) {
                    const replyRef = ref(db, `posts/${postId}/comments/${reply.id}`);
                    await remove(replyRef);
                }
            } else {
                throw new Error("Unauthorized or comment not found.");
            }
        };

        toast.promise(promise(), {
            loading: 'Deleting comment...',
            success: 'Comment deleted.',
            error: 'Failed to delete comment.',
        });

        return promise().then(() => true).catch(() => false);
    };


  const createGroup = async (groupData: { name: string; description: string; pin?: string, photoFile?: File | null }): Promise<string | null> => {
    if (!user) return null;
    
    const promise = async () => {
        const groupsRef = ref(db, 'groups');
        const newGroupRef = push(groupsRef);
        const groupId = newGroupRef.key!;

        let photoURL = '';
        if (groupData.photoFile) {
            const photoStorageRef = storageRef(storage, `group-avatars/${groupId}`);
            await uploadBytes(photoStorageRef, groupData.photoFile);
            photoURL = await getDownloadURL(photoStorageRef);
        }

        const newGroup: Omit<Group, 'id' | 'members'> = {
            name: groupData.name,
            description: groupData.description,
            creatorUid: user.uid,
            creatorName: user.name,
            hasPin: !!groupData.pin,
            pin: groupData.pin || null,
            photoURL: photoURL
        };
        await set(newGroupRef, newGroup);
        // Automatically add creator as a member
        await set(ref(db, `groups/${groupId}/members/${user.uid}`), { joinedAt: serverTimestamp(), joinMethod: 'creator' });
        
        await sendMessage(groupId, {
            content: `${user.name} created the group "${groupData.name}".`,
            type: 'system'
        });

        return groupId;
    }
    
    toast.promise(promise(), {
        loading: 'Creating group...',
        success: 'Group created!',
        error: 'Failed to create group.',
    });

    return promise().catch(() => null);
  };
  
    const updateGroup = async (groupId: string, groupData: { name: string; description: string }, photoFile: File | null): Promise<boolean> => {
        if (!user) return false;
        
        const promise = async () => {
            const groupRef = ref(db, `groups/${groupId}`);
            const groupSnapshot = await get(groupRef);
            if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
                const updates: any = { ...groupData };
                if (photoFile) {
                    const photoStorageRef = storageRef(storage, `group-avatars/${groupId}`);
                    await uploadBytes(photoStorageRef, photoFile);
                    updates.photoURL = await getDownloadURL(photoStorageRef);
                }
                await update(groupRef, updates);
            } else {
                throw new Error("Unauthorized or group not found.");
            }
        };

        toast.promise(promise(), {
            loading: 'Saving changes...',
            success: 'Group updated!',
            error: 'Failed to update group.',
        });

        return promise().then(() => true).catch(() => false);
    };
    
    const updateGroupPin = async (groupId: string, pin: string): Promise<boolean> => {
        if (!user) return false;
        
        const promise = async () => {
            const groupRef = ref(db, `groups/${groupId}`);
            const groupSnapshot = await get(groupRef);
            if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
                await update(groupRef, { pin: pin || null, hasPin: !!pin });
            } else {
                throw new Error("Unauthorized or group not found.");
            }
        }
        
        toast.promise(promise(), {
            loading: 'Updating PIN...',
            success: 'Group PIN updated.',
            error: 'Failed to update PIN.',
        });

        return promise().then(() => true).catch(() => false);
    };

    const deleteGroup = async (groupId: string): Promise<boolean> => {
        if (!user) return false;
        
        const promise = async () => {
            const groupRef = ref(db, `groups/${groupId}`);
            const groupSnapshot = await get(groupRef);
            if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
                await remove(groupRef);
            } else {
                throw new Error("Unauthorized or group not found.");
            }
        };

        toast.promise(promise(), {
            loading: 'Deleting group...',
            success: 'Group deleted.',
            error: 'Failed to delete group.',
        });

        return promise().then(() => true).catch(() => false);
    };

  const joinGroup = async (groupId: string, pin?: string): Promise<boolean> => {
      if (!user) return false;
      
      const promise = async () => {
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error("Group not found.");

        if (group.members && Object.keys(group.members).includes(user.uid)) return true;

        if (group.hasPin && group.pin !== pin) {
            throw new Error("Incorrect PIN.");
        }

        const memberRef = ref(db, `groups/${groupId}/members/${user.uid}`);
        await set(memberRef, { joinedAt: serverTimestamp(), joinMethod: 'direct' });
        
        await sendMessage(groupId, {
          content: `${user.name} joined the group.`,
          type: 'system'
        });
      };
      
      toast.promise(promise(), {
          loading: 'Joining group...',
          success: 'Welcome to the group!',
          error: (err) => err.message || 'Failed to join group.',
      });

      return promise().then(() => true).catch(() => false);
  };

  const sendMessage = async (groupId: string, messageData: { content?: string; file?: File; type?: 'system' | 'text' }): Promise<boolean> => {
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;

    if(!messageData.content && !messageData.file) return false;

    try {
        const messagesRef = ref(db, `groups/${groupId}/messages`);
        const newMessageRef = push(messagesRef);

        let messagePayload: Partial<Message>;
        
        if (messageData.type === 'system') {
            messagePayload = {
                id: newMessageRef.key!,
                content: messageData.content!,
                timestamp: serverTimestamp() as any,
                type: 'system',
            };
        } else {
            if (!user) return false;

            const urlMatch = messageData.content?.match(urlRegex);
            let linkPreview = null;
            if (urlMatch) {
                linkPreview = await getLinkPreview(urlMatch[0]);
            }

            messagePayload = {
                id: newMessageRef.key!,
                creatorUid: user.uid,
                creatorName: user.name,
                creatorPhotoURL: user.photoURL || '',
                timestamp: serverTimestamp() as any,
                linkPreview,
            };

            if (messageData.file) {
                const file = messageData.file;
                const fileRef = storageRef(storage, `group-files/${groupId}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(fileRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                
                messagePayload = {
                    ...messagePayload,
                    content: '',
                    type: getFileType(file),
                    fileUrl: downloadURL,
                    fileName: file.name,
                };
            } else if (messageData.content) {
                 messagePayload = {
                    ...messagePayload,
                    content: messageData.content,
                    type: 'text',
                };
            }
        }
        
        await set(newMessageRef, messagePayload);

        // Create notifications for all other group members
        if (messageData.type !== 'system' && user) {
            const memberIds = group.members ? Object.keys(group.members) : [];
            const notificationPromises = memberIds
                .filter(memberId => memberId !== user.uid)
                .map(memberId => {
                     const notificationPayload = {
                        recipientUid: memberId,
                        actorUid: user.uid,
                        actorName: user.name,
                        actorPhotoURL: user.photoURL,
                        type: 'new_group_message' as const,
                        targetUrl: `/groups/${groupId}`,
                        targetId: groupId,
                        message: `sent a message in "${group.name}"`,
                    };
                    postToWebView({
                        title: user.name,
                        body: notificationPayload.message,
                        url: notificationPayload.targetUrl
                    });
                    return createNotification(notificationPayload);
                });
            await Promise.all(notificationPromises);
        }
        
        return true;
    } catch (e) {
        console.error("Error sending message:", e);
        return false;
    }
  };
  
    const editMessage = async (groupId: string, messageId: string, newContent: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `groups/${groupId}/messages/${messageId}`);
            const msgSnapshot = await get(messageRef);
            if (msgSnapshot.exists() && msgSnapshot.val().creatorUid === user.uid) {
                const urlMatch = newContent.match(urlRegex);
                let linkPreview = null;
                if (urlMatch) {
                    linkPreview = await getLinkPreview(urlMatch[0]);
                }
                const updateData: any = { content: newContent, isEdited: true, linkPreview };
                
                await update(messageRef, updateData);
                toast.success("Message updated.");
                return true;
            }
            return false;
        } catch (e) {
            toast.error("Failed to edit message.");
            return false;
        }
    };

    const deleteMessage = async (groupId: string, messageId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `groups/${groupId}/messages/${messageId}`);
            const msgSnapshot = await get(messageRef);
            if (msgSnapshot.exists() && msgSnapshot.val().creatorUid === user.uid) {
                await remove(messageRef);
                return true;
            }
            return false;
        } catch (e) {
            toast.error("Failed to delete message.");
            return false;
        }
    };

    const reactToMessage = async (groupId: string, messageId: string, reaction: string): Promise<void> => {
        if (!user) return;
        const reactionRef = ref(db, `groups/${groupId}/messages/${messageId}/reactions/${reaction}/${user.uid}`);
        const reactionSnapshot = await get(reactionRef);

        if (reactionSnapshot.exists()) {
            await remove(reactionRef);
        } else {
            await set(reactionRef, true);
        }
    };

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user || user.uid === otherUserId) return null;
    
    // Generate a consistent conversation ID
    const conversationId = user.uid > otherUserId 
        ? `${otherUserId}_${user.uid}` 
        : `${user.uid}_${otherUserId}`;

    const conversationRef = ref(db, `conversations/${conversationId}`);
    const conversationSnapshot = await get(conversationRef);

    if (conversationSnapshot.exists()) {
        const userDeleteRef = ref(db, `users/${user.uid}/deletedConversations/${conversationId}`);
        remove(userDeleteRef);
        
        // Also add the conversation ID to both users' profiles if it's not there
        const updates: any = {};
        updates[`/users/${user.uid}/conversationIds/${conversationId}`] = true;
        updates[`/users/${otherUserId}/conversationIds/${conversationId}`] = true;
        await update(ref(db), updates);

        return conversationId;
    } else {
        const otherUser = allUsers.find(u => u.uid === otherUserId);
        if (!otherUser) return null;

        const newConversation: Omit<Conversation, 'id' | 'messages' | 'participantUids'> = {
            participants: {
                [user.uid]: { name: user.name, photoURL: user.photoURL || '', uid: user.uid },
                [otherUserId]: { name: otherUser.name, photoURL: otherUser.photoURL || '', uid: otherUser.uid },
            },
            lastMessage: null,
            timestamp: serverTimestamp() as any,
        };

        try {
            await set(conversationRef, newConversation);
            // Add conversation ID to both users' profiles
            const updates: any = {};
            updates[`/users/${user.uid}/conversationIds/${conversationId}`] = true;
            updates[`/users/${otherUserId}/conversationIds/${conversationId}`] = true;
            await update(ref(db), updates);
            toast.success("Conversation started!");
            return conversationId;
        } catch (error) {
            toast.error("Could not start conversation.");
            return null;
        }
    }
  };

  const sendDirectMessage = async (conversationId: string, messageData: { content?: string, file?: File }): Promise<boolean> => {
    if (!user) return false;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return false;

    if(!messageData.content && !messageData.file) return false;

    try {
        const messagesRef = ref(db, `conversations/${conversationId}/messages`);
        const newMessageRef = push(messagesRef);

        const urlMatch = messageData.content?.match(urlRegex);
        let linkPreview = null;
        if (urlMatch) {
            linkPreview = await getLinkPreview(urlMatch[0]);
        }

        let messagePayload: Message = {
            id: newMessageRef.key!,
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            timestamp: serverTimestamp() as any,
            content: '',
            type: 'text', // default
            linkPreview,
        };

        if (messageData.file) {
            const file = messageData.file;
            const fileRef = storageRef(storage, `direct-messages/${conversationId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            messagePayload = {
                ...messagePayload,
                type: getFileType(file),
                fileUrl: downloadURL,
                fileName: file.name,
            };
        } else if (messageData.content) {
            messagePayload = {
                ...messagePayload,
                content: messageData.content,
                type: 'text',
            };
        }
        
        await set(newMessageRef, messagePayload);

        // Update last message and timestamp for the conversation
        await update(ref(db, `conversations/${conversationId}`), {
            lastMessage: messagePayload,
            timestamp: serverTimestamp()
        });

        // Notify the other participant
        const otherUserId = conversation.participantUids.find(uid => uid !== user.uid);
        if (otherUserId) {
             const notificationPayload = {
                recipientUid: otherUserId,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'new_direct_message' as const,
                targetUrl: `/messages/${conversationId}`,
                targetId: conversationId,
                message: "sent you a new message.",
            };
            await createNotification(notificationPayload);
            postToWebView({
                title: user.name,
                body: "sent you a new message.",
                url: notificationPayload.targetUrl,
            });
        }
        
        return true;
    } catch (e) {
        toast.error("Failed to send message.");
        return false;
    }
  };
  
    const editDirectMessage = async (conversationId: string, messageId: string, newContent: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `conversations/${conversationId}/messages/${messageId}`);
            const msgSnapshot = await get(messageRef);
            if (msgSnapshot.exists() && msgSnapshot.val().creatorUid === user.uid) {
                const urlMatch = newContent.match(urlRegex);
                let linkPreview = null;
                if (urlMatch) {
                    linkPreview = await getLinkPreview(urlMatch[0]);
                }
                const updateData: any = { content: newContent, isEdited: true, linkPreview };

                await update(messageRef, updateData);
                toast.success("Message updated.");
                return true;
            }
            return false;
        } catch (e) {
            toast.error("Failed to edit message.");
            return false;
        }
    };

    const deleteDirectMessage = async (conversationId: string, messageId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `conversations/${conversationId}/messages/${messageId}`);
             const msgSnapshot = await get(messageRef);
            if (msgSnapshot.exists() && msgSnapshot.val().creatorUid === user.uid) {
                await remove(messageRef);
                return true;
            }
            return false;
        } catch (e) {
            toast.error("Failed to delete message.");
            return false;
        }
    };
    
    const reactToDirectMessage = async (conversationId: string, messageId: string, reaction: string): Promise<void> => {
        if (!user) return;
        const reactionRef = ref(db, `conversations/${conversationId}/messages/${messageId}/reactions/${reaction}/${user.uid}`);
        const reactionSnapshot = await get(reactionRef);

        if (reactionSnapshot.exists()) {
            await remove(reactionRef);
        } else {
            await set(reactionRef, true);
        }
    };

  const getConversationById = (conversationId: string) => {
    return conversations.find(c => c.id === conversationId);
  };


  const markNotificationsAsRead = async () => {
      if (!user || notifications.length === 0) return;
      const unreadNotifs = notifications.filter(n => !n.isRead);
      if (unreadNotifs.length === 0) return;

      const updates: { [key: string]: any } = {};
      unreadNotifs.forEach(notif => {
          updates[`/notifications/${user.uid}/${notif.id}/isRead`] = true;
      });

      try {
        await update(ref(db), updates);
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
  }

  const markMessagesAsRead = async (id: string, isDirect: boolean = false) => {
      if (!user) return;
      const basePath = isDirect ? `conversations/${id}` : `groups/${id}`;
      const messagesRef = ref(db, `${basePath}/messages`);
      const snapshot = await get(messagesRef);
      if (!snapshot.exists()) return;

      const updates: { [key: string]: any } = {};
      const messages = snapshot.val();
      Object.keys(messages).forEach(messageId => {
          const message = messages[messageId];
          if (message.creatorUid !== user.uid && (!message.readBy || !message.readBy[user.uid])) {
              updates[`${basePath}/messages/${messageId}/readBy/${user.uid}`] = serverTimestamp();
          }
      });

      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
  };

  const updateTypingStatus = async (id: string, isTyping: boolean, isDirect: boolean = false) => {
      if (!user) return;
      const path = isDirect ? `conversations/${id}/typing/${user.uid}` : `groups/${id}/typing/${user.uid}`;
      const typingRef = ref(db, path);
      if (isTyping) {
          await set(typingRef, true);
      } else {
          await remove(typingRef);
      }
  };
  
  const togglePinConversation = (conversationId: string) => {
        if (!user) return;
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        
        const isPinned = conversation.pinnedBy && conversation.pinnedBy[user.uid];
        const pinRef = ref(db, `conversations/${conversationId}/pinnedBy/${user.uid}`);
        
        if (isPinned) {
            remove(pinRef);
        } else {
            set(pinRef, true);
        }
  };

    const deleteConversationForUser = (conversationId: string) => {
        if (!user) return;
        const deleteRef = ref(db, `users/${user.uid}/deletedConversations/${conversationId}`);
        set(deleteRef, true);
    };

    const lockConversation = (conversationId: string, pin: string) => {
        const newLocks = { ...lockedConversations, [conversationId]: pin };
        setLockedConversations(newLocks);
        localStorage.setItem('lockedConversations', JSON.stringify(newLocks));
    };

    const unlockConversation = (conversationId: string) => {
        const newLocks = { ...lockedConversations };
        delete newLocks[conversationId];
        setLockedConversations(newLocks);
        localStorage.setItem('lockedConversations', JSON.stringify(newLocks));
    };

    const toggleBlockUser = async (targetUserId: string) => {
        if (!user) return;
        const blockRef = ref(db, `users/${user.uid}/blockedUsers/${targetUserId}`);
        const isBlocked = user.blockedUsers?.includes(targetUserId);

        if (isBlocked) {
            await remove(blockRef);
            toast.success("User unblocked.");
        } else {
            await set(blockRef, true);
            toast.success("User blocked.");
        }
    };

    const updateThemePreference = async (theme: 'light' | 'dark') => {
        if (!user) return;
        const themeRef = ref(db, `users/${user.uid}/theme`);
        await set(themeRef, theme);
    };

    const requestWithdrawal = async (amount: number, method: 'Mpesa' | 'Skrill', paymentDetail: string) => {
        if (!user || user.type !== 'user' || user.points < amount) {
            toast.error("Invalid withdrawal request.");
            return;
        }

        const adminUid = allUsers.find(u => u.email === 'polokopule91@gmail.com')?.uid;
        if (!adminUid) {
            toast.error("Admin user not found. Cannot process withdrawal.");
            return;
        }

        const POINTS_TO_ZAR_RATE = 0.10;
        const zarAmount = amount * POINTS_TO_ZAR_RATE;

        const requestRef = ref(db, `users/${user.uid}/withdrawalRequests`);
        const newRequestRef = push(requestRef);
        const requestId = newRequestRef.key!;

        const withdrawalRequest: WithdrawalRequest = {
            id: requestId,
            userId: user.uid,
            userName: user.name,
            userEmail: user.email,
            points: amount,
            amountZAR: zarAmount,
            status: 'pending',
            requestedAt: serverTimestamp() as any,
            method: method,
            paymentDetail: paymentDetail
        };
        
        const userPointsRef = ref(db, `users/${user.uid}/points`);

        const promise = async () => {
            await set(newRequestRef, withdrawalRequest);
            await update(ref(db, `users/${user.uid}`), { points: user.points - amount });
            
            // Notify Admin
            await createNotification({
                recipientUid: adminUid,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'withdrawal_request',
                targetUrl: `/dashboard`,
                targetId: requestId,
                message: `requested a withdrawal of ${amount} UPs.`,
            });
        };

        toast.promise(promise(), {
            loading: 'Submitting request...',
            success: 'Withdrawal request submitted!',
            error: 'Failed to submit request.',
        });
    };

    const approveWithdrawal = async (request: WithdrawalRequest) => {
        if (!user || user.email !== 'polokopule91@gmail.com') return;

        const requestRef = ref(db, `users/${request.userId}/withdrawalRequests/${request.id}`);

        const promise = async () => {
            await update(requestRef, { status: 'approved', processedAt: serverTimestamp() });
            
            await createNotification({
                recipientUid: request.userId,
                actorUid: user.uid,
                actorName: "Admin",
                type: 'withdrawal_approved',
                targetUrl: '/withdraw',
                targetId: request.id,
                message: `Your withdrawal of ${request.points} UPs has been approved.`,
            });
        };

        toast.promise(promise(), {
            loading: 'Approving request...',
            success: 'Withdrawal approved.',
            error: 'Failed to approve request.',
        });
    };

    const rejectWithdrawal = async (request: WithdrawalRequest) => {
        if (!user || user.email !== 'polokopule91@gmail.com') return;
        
        const requestRef = ref(db, `users/${request.userId}/withdrawalRequests/${request.id}`);
        const targetUserRef = ref(db, `users/${request.userId}`);

        const promise = async () => {
            const targetUserSnapshot = await get(targetUserRef);
            if (!targetUserSnapshot.exists()) throw new Error("Target user not found.");
            
            const targetUser = targetUserSnapshot.val();
            const refundedPoints = targetUser.points + request.points;

            await update(requestRef, { status: 'rejected', processedAt: serverTimestamp() });
            await update(targetUserRef, { points: refundedPoints });

            await createNotification({
                recipientUid: request.userId,
                actorUid: user.uid,
                actorName: "Admin",
                type: 'withdrawal_rejected',
                targetUrl: '/withdraw',
                targetId: request.id,
                message: `Your withdrawal of ${request.points} UPs was rejected and points have been refunded.`,
            });
        };

         toast.promise(promise(), {
            loading: 'Rejecting request...',
            success: 'Withdrawal rejected.',
            error: 'Failed to reject request.',
        });
    };

    const toggleUserBan = async (userId: string, ban: boolean) => {
        if (!user || user.email !== 'polokopule91@gmail.com') return;
        const userRef = ref(db, `users/${userId}/banned`);
        await set(userRef, ban);
    };

    const rateCourse = async (courseId: string, rating: number) => {
        if (!user) return;
        const ratingRef = ref(db, `courses/${courseId}/ratings/${user.uid}`);
        await set(ratingRef, rating);
    }


  const value = {
    user,
    allUsers,
    firebaseUser,
    courses,
    ads,
    posts,
    groups,
    conversations,
    purchasedCourses,
    notifications,
    login,
    logout,
    updateUserProfile,
    enableNotifications,
    addCourse,
    updateCourse,
    deleteCourse,
    purchaseCourse,
    claimAdPoints,
    createAd,
    updateAd,
    deleteAd,
    followUser,
    unfollowUser,
    addPost,
    updatePost,
    deletePost,
    likePost,
    addComment,
    likeComment,
    deleteComment,
    createGroup,
    updateGroup,
    updateGroupPin,
    deleteGroup,
joinGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    startConversation,
    sendDirectMessage,
    editDirectMessage,
    deleteDirectMessage,
    reactToDirectMessage,
    getConversationById,
    markNotificationsAsRead,
    markMessagesAsRead,
    updateTypingStatus,
    togglePinConversation,
    deleteConversationForUser,
    lockConversation,
    unlockConversation,
    toggleBlockUser,
    updateThemePreference,
    requestWithdrawal,
    approveWithdrawal,
    rejectWithdrawal,
    toggleUserBan,
    rateCourse,
    lockedConversations,
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
