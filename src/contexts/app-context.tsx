
"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse, Post, Group, Comment, Message, Notification, LinkPreview, Conversation, AIChatMessage } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { ref, onValue, set, get, update, remove, push, serverTimestamp, query, orderByChild, equalTo } from "firebase/database";
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateLinkPreview } from '@/ai/flows/generate-link-preview';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase"; // Import app

type AddCourseData = {
    title: string;
    content: string;
    price: number;
    coverImage: File;
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
  updateCourse: (courseId: string, courseData: Partial<Omit<Course, 'id' | 'creator' | 'creatorName'>>) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  purchaseCourse: (courseId: string) => Promise<boolean>;
  watchAd: (adId: string) => void;
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
  updateAIChatHistory: (history: AIChatMessage[]) => Promise<void>;
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

  useEffect(() => {
    // Load locked conversations from local storage
    const storedLocks = localStorage.getItem('lockedConversations');
    if (storedLocks) {
      setLockedConversations(JSON.parse(storedLocks));
    }

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
                    photoURL: currentFirebaseUser.photoURL || userData.photoURL || '',
                    followers: userData.followers ? Object.keys(userData.followers) : [],
                    following: userData.following ? Object.keys(userData.following) : [],
                    blockedUsers: userData.blockedUsers ? Object.keys(userData.blockedUsers) : [],
                    aiChatHistory: userData.aiChatHistory ? Object.values(userData.aiChatHistory) : [],
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
    const groupsRef = ref(db, 'groups');

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
      unsubscribe();
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

        const notificationsRef = ref(db, `notifications/${user.uid}`);
        notificationsListener = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val() || {};
            setNotifications(Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp));
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
            
            return true;
        } catch (error) {
            console.error("Error updating profile:", error);
            return false;
        }
    };
    
    const enableNotifications = async () => {
        if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            console.error("Push messaging is not supported");
            return;
        }

        try {
            const messaging = getMessaging(app);
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                console.log('Notification permission granted.');
                const vapidKey = "YOUR_VAPID_PUBLIC_KEY"; // IMPORTANT: Replace with your actual VAPID key
                const fcmToken = await getToken(messaging, { vapidKey });

                if (fcmToken) {
                    console.log('FCM Token:', fcmToken);
                    // Save the token to the user's profile in the database
                    const userRef = ref(db, `users/${user.uid}/fcmTokens/${fcmToken}`);
                    await set(userRef, true);
                    alert("Notifications have been enabled!");
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            } else {
                console.log('Unable to get permission to notify.');
            }
        } catch (error) {
            console.error('An error occurred while retrieving token. ', error);
        }
    };


  const addCourse = async (courseData: AddCourseData): Promise<boolean> => {
    if (!user || user.type !== 'user') return false;
    
    const { title, content, price, coverImage } = courseData;
    
    try {
        // 1. Upload image to Firebase Storage
        const courseId = `course-${Date.now()}`;
        const imageStorageRef = storageRef(storage, `course-images/${courseId}/${coverImage.name}`);
        const uploadResult = await uploadBytes(imageStorageRef, coverImage);
        const imageUrl = await getDownloadURL(uploadResult.ref);

        // 2. Create course object with the storage URL
        const newCourse: Course = {
            id: courseId,
            title,
            content,
            price,
            imageUrl,
            creator: user.uid,
            creatorName: user.name,
            imageHint: "new course" // Placeholder hint
        };

        // 3. Save course to Realtime Database
        await set(ref(db, `courses/${courseId}`), newCourse);
        return true;
    } catch(e) {
        console.error("Error adding course:", e);
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
    const currentUserRef = ref(db, `users/${user.uid}/following/${targetUserId}`);
    await set(currentUserRef, true);

    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}/followers/${user.uid}`);
    await set(targetUserRef, true);
        
    // Create notification
    await createNotification({
        recipientUid: targetUserId,
        actorUid: user.uid,
        actorName: user.name,
        actorPhotoURL: user.photoURL,
        type: 'new_follower',
        targetUrl: `/profile/${user.uid}`,
        targetId: user.uid,
    });
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    // Update current user's following list
    const currentUserRef = ref(db, `users/${user.uid}/following/${targetUserId}`);
    await remove(currentUserRef);
    
    // Update target user's followers list
    const targetUserRef = ref(db, `users/${targetUserId}/followers/${user.uid}`);
    await remove(targetUserRef);
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
            await createNotification({
                recipientUid: uid,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'mention',
                targetUrl: `/posts/${postId}${commentId ? `#comment-${commentId}` : ''}`,
                targetId: commentId || postId,
                message: commentId ? 'a comment' : 'a post',
            });
        }
    };

    const addPost = async (postData: AddPostData): Promise<boolean> => {
      if (!user) return false;
      const { content, file, repostedFrom, fileUrl, fileName, fileType, linkPreview } = postData;
      if (!content?.trim() && !file && !fileUrl) return false;
      
      try {
        const postsRef = ref(db, 'posts');
        const newPostRef = push(postsRef);
        const postId = newPostRef.key!;
        
        let newPost: Omit<Post, 'id' | 'likes' | 'comments'> & {id: string} = {
            id: postId,
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            content: content || '',
            timestamp: serverTimestamp() as any, // This will be converted by firebase
            repostedFrom: repostedFrom || null,
            linkPreview: null, // Start with null
        };
        
        if (file) {
            const fileStorageRef = storageRef(storage, `post-files/${postId}/${file.name}`);
            const snapshot = await uploadBytes(fileStorageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            newPost.fileUrl = downloadURL;
            newPost.fileName = file.name;
            newPost.fileType = getFileType(file);
        } else if (fileUrl && fileName && fileType) {
            // This is a repost with media
            newPost.fileUrl = fileUrl;
            newPost.fileName = fileName;
            newPost.fileType = fileType;
        }
        
        // Create the post first
        await set(newPostRef, newPost);

        // Then, asynchronously generate and update the link preview if a URL exists
        const urlMatch = content.match(urlRegex);
        if (urlMatch) {
            generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                if (preview.title) {
                    update(newPostRef, { linkPreview: preview });
                }
            }).catch(e => console.error("Link preview generation failed, but post was created.", e));
        }

        if (content) {
            await handleMentions(content, postId);
        }
        
        if (repostedFrom && repostedFrom.creatorUid !== user.uid) {
            await createNotification({
                recipientUid: repostedFrom.creatorUid,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'repost',
                targetUrl: `/posts/${postId}`,
                targetId: postId,
                message: "reposted your post.",
            });
        }
        
        return true;
      } catch (e) {
        console.error("Error adding post:", e);
        return false;
      }
  };
  
  const updatePost = async (postId: string, postData: { content: string }): Promise<boolean> => {
      if (!user) return false;
      const postRef = ref(db, `posts/${postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists() && postSnapshot.val().creatorUid === user.uid) {
          try {
              await update(postRef, { content: postData.content });
              await handleMentions(postData.content, postId);
              return true;
          } catch (e) {
              console.error("Error updating post:", e);
              return false;
          }
      }
      return false;
  };
  
  const deletePost = async (postId: string): Promise<boolean> => {
      if (!user) return false;
      const postRef = ref(db, `posts/${postId}`);
      const postSnapshot = await get(postRef);
      if (postSnapshot.exists() && postSnapshot.val().creatorUid === user.uid) {
          try {
              await remove(postRef);
              return true;
          } catch (e) {
              console.error("Error deleting post:", e);
              return false;
          }
      }
      return false;
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
                await createNotification({
                    recipientUid: post.creatorUid,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: 'post_like',
                    targetUrl: `/posts/${post.id}`,
                    targetId: postId,
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
                console.error("Post does not exist.");
                return false;
            }

            const commentsRef = ref(db, `posts/${postId}/comments`);
            const newCommentRef = push(commentsRef);
            const commentId = newCommentRef.key!;

            let newComment: Omit<Comment, 'id' | 'likes'> = {
                id: commentId,
                creatorUid: user.uid,
                creatorName: user.name,
                creatorPhotoURL: user.photoURL || '',
                content: content,
                timestamp: serverTimestamp() as any,
                parentId: parentId,
                postId: postId,
                linkPreview: null,
            };
            
            // Set comment without preview first
            await set(newCommentRef, newComment);

            const urlMatch = content.match(urlRegex);
            if (urlMatch) {
                generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                    if(preview.title) {
                        update(newCommentRef, { linkPreview: preview });
                    }
                }).catch(e => console.error("Link preview failed for comment, but comment was created.", e));
            }
            
            await handleMentions(content, postId, commentId);

            const post = posts.find(p => p.id === postId);
            if (post && post.creatorUid !== user.uid) {
                 await createNotification({
                    recipientUid: post.creatorUid,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: parentId ? 'new_reply' : 'new_comment',
                    targetUrl: `/posts/${postId}#comment-${commentId}`,
                    targetId: postId,
                });
            }
            // Also notify parent comment author if it's a reply and not their own comment
            if (parentId) {
                const parentComment = post?.comments?.find(c => c.id === parentId);
                if (parentComment && parentComment.creatorUid !== user.uid && parentComment.creatorUid !== post?.creatorUid) {
                     await createNotification({
                        recipientUid: parentComment.creatorUid,
                        actorUid: user.uid,
                        actorName: user.name,
                        actorPhotoURL: user.photoURL,
                        type: 'new_reply',
                        targetUrl: `/posts/${postId}#comment-${commentId}`,
                        targetId: postId,
                    });
                }
            }
            return true;
        } catch (e) {
            console.error("Failed to add comment:", e);
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
                    await createNotification({
                        recipientUid: comment.creatorUid,
                        actorUid: user.uid,
                        actorName: user.name,
                        actorPhotoURL: user.photoURL,
                        type: 'comment_like',
                        targetUrl: `/posts/${postId}#comment-${commentId}`,
                        targetId: postId,
                    });
                }
            }
        }
    };
    
    const deleteComment = async (postId: string, commentId: string): Promise<boolean> => {
        if (!user) return false;
        try {
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
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error deleting comment:", e);
            return false;
        }
    };


  const createGroup = async (groupData: { name: string; description: string; pin?: string, photoFile?: File | null }): Promise<string | null> => {
    if (!user) return null;
    
    try {
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
    } catch(e) {
        console.error(e)
        return null;
    }
  };
  
    const updateGroup = async (groupId: string, groupData: { name: string; description: string }, photoFile: File | null): Promise<boolean> => {
        if (!user) return false;
        const groupRef = ref(db, `groups/${groupId}`);
        const groupSnapshot = await get(groupRef);
        if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
            try {
                const updates: any = { ...groupData };
                if (photoFile) {
                    const photoStorageRef = storageRef(storage, `group-avatars/${groupId}`);
                    await uploadBytes(photoStorageRef, photoFile);
                    updates.photoURL = await getDownloadURL(photoStorageRef);
                }
                await update(groupRef, updates);
                return true;
            } catch (e) {
                console.error("Error updating group:", e);
                return false;
            }
        }
        return false;
    };
    
    const updateGroupPin = async (groupId: string, pin: string): Promise<boolean> => {
        if (!user) return false;
        const groupRef = ref(db, `groups/${groupId}`);
        const groupSnapshot = await get(groupRef);
        if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
            try {
                await update(groupRef, { pin: pin || null, hasPin: !!pin });
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    const deleteGroup = async (groupId: string): Promise<boolean> => {
        if (!user) return false;
        const groupRef = ref(db, `groups/${groupId}`);
        const groupSnapshot = await get(groupRef);
        if (groupSnapshot.exists() && groupSnapshot.val().creatorUid === user.uid) {
            try {
                await remove(groupRef);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

  const joinGroup = async (groupId: string, pin?: string): Promise<boolean> => {
      if (!user) return false;
      const group = groups.find(g => g.id === groupId);
      if (!group) return false;

      // Check if user is already a member
      if (group.members && Object.keys(group.members).includes(user.uid)) return true;

      // Check PIN if the group is private
      if (group.hasPin && group.pin !== pin) {
          return false;
      }

      try {
          const memberRef = ref(db, `groups/${groupId}/members/${user.uid}`);
          await set(memberRef, { joinedAt: serverTimestamp(), joinMethod: 'direct' });
          
          await sendMessage(groupId, {
            content: `${user.name} joined the group.`,
            type: 'system'
          });

          return true;
      } catch(e) {
          return false;
      }
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

            messagePayload = {
                id: newMessageRef.key!,
                creatorUid: user.uid,
                creatorName: user.name,
                creatorPhotoURL: user.photoURL || '',
                timestamp: serverTimestamp() as any,
                linkPreview: null,
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

        if (messageData.type !== 'system' && messageData.content) {
            const urlMatch = messageData.content.match(urlRegex);
            if (urlMatch) {
                generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                    if (preview.title) {
                        update(newMessageRef, { linkPreview: preview });
                    }
                }).catch(e => console.error("Link preview generation failed, but message was created.", e));
            }
        }

        // Create notifications for all other group members
        if (messageData.type !== 'system' && user) {
            const memberIds = group.members ? Object.keys(group.members) : [];
            const notificationPromises = memberIds
                .filter(memberId => memberId !== user.uid)
                .map(memberId => createNotification({
                    recipientUid: memberId,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: 'new_group_message',
                    targetUrl: `/groups/${groupId}`,
                    targetId: groupId,
                    message: `sent a message in "${group.name}"`,
                }));
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
                const updateData: any = { content: newContent, isEdited: true };

                const urlMatch = newContent.match(urlRegex);
                if (urlMatch) {
                    generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                        update(messageRef, { linkPreview: preview.title ? preview : null });
                    }).catch(e => console.error("Link preview update failed.", e));
                } else {
                    updateData.linkPreview = null;
                }
                
                await update(messageRef, updateData);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error editing message:", e);
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
            console.error("Error deleting message:", e);
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

            return conversationId;
        } catch (error) {
            console.error("Error starting conversation:", error);
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

        let messagePayload: Message = {
            id: newMessageRef.key!,
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            timestamp: serverTimestamp() as any,
            content: '',
            type: 'text', // default
            linkPreview: null,
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

        const urlMatch = messageData.content?.match(urlRegex);
        if (urlMatch) {
             generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                if (preview.title) {
                    update(newMessageRef, { linkPreview: preview });
                }
            }).catch(e => console.error("Link preview failed for DM, but message was sent.", e));
        }

        // Update last message and timestamp for the conversation
        await update(ref(db, `conversations/${conversationId}`), {
            lastMessage: messagePayload,
            timestamp: serverTimestamp()
        });

        // Notify the other participant
        const otherUserId = conversation.participantUids.find(uid => uid !== user.uid);
        if (otherUserId) {
            await createNotification({
                recipientUid: otherUserId,
                actorUid: user.uid,
                actorName: user.name,
                actorPhotoURL: user.photoURL,
                type: 'new_direct_message',
                targetUrl: `/messages/${conversationId}`,
                targetId: conversationId,
                message: "sent you a new message.",
            });
        }
        
        return true;
    } catch (e) {
        console.error("Error sending direct message:", e);
        return false;
    }
  };
  
    const editDirectMessage = async (conversationId: string, messageId: string, newContent: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `conversations/${conversationId}/messages/${messageId}`);
            const msgSnapshot = await get(messageRef);
            if (msgSnapshot.exists() && msgSnapshot.val().creatorUid === user.uid) {
                const updateData: any = { content: newContent, isEdited: true };

                const urlMatch = newContent.match(urlRegex);
                if (urlMatch) {
                     generateLinkPreview({ url: urlMatch[0] }).then(preview => {
                        update(messageRef, { linkPreview: preview.title ? preview : null });
                    }).catch(e => console.error("Link preview update failed.", e));
                } else {
                    updateData.linkPreview = null;
                }

                await update(messageRef, updateData);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error editing direct message:", e);
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
            console.error("Error deleting direct message:", e);
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
        } else {
            await set(blockRef, true);
        }
    };

    const updateAIChatHistory = async (history: AIChatMessage[]) => {
        if (!user) return;
        const historyRef = ref(db, `users/${user.uid}/aiChatHistory`);
        await set(historyRef, history);
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
    watchAd,
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
    updateAIChatHistory,
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
