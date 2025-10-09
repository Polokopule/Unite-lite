

"use client";

import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Course, Ad, User, PurchasedCourse, Post, Group, Comment, Message, Notification, LinkPreview, Conversation } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { ref, onValue, set, get, update, remove, push, serverTimestamp, query, orderByChild, equalTo } from "firebase/database";
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
  addPost: (postData: { content: string; file: File | null; linkPreview: LinkPreview | null }) => Promise<boolean>;
  updatePost: (postId: string, postData: { content: string }) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string | null) => Promise<boolean>;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  createGroup: (groupData: { name: string; description: string; pin?: string }) => Promise<boolean>;
  joinGroup: (groupId: string, pin?: string) => Promise<boolean>;
  sendMessage: (groupId: string, messageData: { content: string; type: 'text' } | { file: File; type: 'image' | 'audio' | 'video' | 'file' }) => Promise<boolean>;
  editMessage: (groupId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (groupId: string, messageId: string) => Promise<boolean>;
  startConversation: (otherUserId: string) => Promise<string | null>;
  sendDirectMessage: (conversationId: string, messageData: { content: string; type: 'text' } | { file: File; type: 'image' | 'audio' | 'video' | 'file' }) => Promise<boolean>;
  editDirectMessage: (conversationId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteDirectMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  getConversationById: (conversationId: string) => Conversation | undefined;
  markNotificationsAsRead: () => Promise<void>;
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
        const userList: User[] = data ? Object.values(data) : [];
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
            members: data[key].members ? Object.keys(data[key].members) : [],
            messages: data[key].messages ? Object.values(data[key].messages) : []
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
    let conversationsListener: () => void;
    
    if (user) {
      // Load purchased courses when user logs in
      const purchasedRef = ref(db, `users/${user.uid}/purchasedCourses`);
      purchasedListener = onValue(purchasedRef, (snapshot) => {
        if (snapshot.exists()) {
          setPurchasedCourses(Object.values(snapshot.val()));
        } else {
          setPurchasedCourses([]);
        }
      });
      
      const notificationsRef = ref(db, `notifications/${user.uid}`);
      notificationsListener = onValue(notificationsRef, (snapshot) => {
          const data = snapshot.val() || {};
          const notificationList: Notification[] = Object.values(data);
          setNotifications(notificationList.sort((a,b) => b.timestamp - a.timestamp));
      });

      const userConversationsRef = ref(db, `users/${user.uid}/conversationIds`);
      onValue(userConversationsRef, (snapshot) => {
          const convoIds = snapshot.val();
          if (convoIds) {
              const convoRef = ref(db, 'conversations');
              onValue(convoRef, (convoSnapshot) => {
                  const allConvos = convoSnapshot.val() || {};
                  const userConvos = Object.keys(convoIds)
                    .map(id => ({ id, ...allConvos[id] }))
                    .filter(c => c.participantUids)
                    .map(c => ({...c, messages: c.messages ? Object.values(c.messages) : [] }))
                    .sort((a, b) => (b.lastMessage?.timestamp || b.timestamp) - (a.lastMessage?.timestamp || a.timestamp));
                  setConversations(userConvos);
              })
          } else {
              setConversations([]);
          }
      });

    } else {
      setPurchasedCourses([]);
      setNotifications([]);
      setConversations([]);
    }
    
    return () => {
        if (purchasedListener) purchasedListener();
        if (notificationsListener) notificationsListener();
        if (conversationsListener) conversationsListener();
    }
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

    const getFileType = (file: File): 'image' | 'audio' | 'video' | 'file' => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.startsWith('video/')) return 'video';
        return 'file';
    }

  const addPost = async (postData: { content: string; file: File | null; linkPreview: LinkPreview | null }): Promise<boolean> => {
      if (!user) return false;
      const { content, file, linkPreview } = postData;
      if (!content.trim() && !file) return false;
      
      try {
        const postsRef = ref(db, 'posts');
        const newPostRef = push(postsRef);
        
        let newPost: Omit<Post, 'id' | 'likes' | 'comments'> & {id: string} = {
            id: newPostRef.key!,
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            content: content,
            timestamp: serverTimestamp() as any, // This will be converted by firebase
        };

        if (linkPreview) {
          newPost.linkPreview = linkPreview;
        }

        if (file) {
            const fileStorageRef = storageRef(storage, `post-files/${newPostRef.key}/${file.name}`);
            const snapshot = await uploadBytes(fileStorageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            newPost.fileUrl = downloadURL;
            newPost.fileName = file.name;
            newPost.fileType = getFileType(file);
        }

        await set(newPostRef, newPost);
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
                    targetUrl: `/profile/${post.creatorUid}`, // Or a dedicated post page later
                    targetId: postId,
                });
            }
        }
      }
  };

    const addComment = async (postId: string, content: string, parentId: string | null = null): Promise<boolean> => {
        if (!user || !content.trim()) return false;
        try {
            const commentsRef = ref(db, `posts/${postId}/comments`);
            const newCommentRef = push(commentsRef);
            const newComment: Omit<Comment, 'id' | 'likes'> = {
                id: newCommentRef.key!,
                creatorUid: user.uid,
                creatorName: user.name,
                creatorPhotoURL: user.photoURL || '',
                content: content,
                timestamp: serverTimestamp() as any,
                parentId: parentId,
                postId: postId
            };
            await set(newCommentRef, newComment);

            const post = posts.find(p => p.id === postId);
            if (post && post.creatorUid !== user.uid) {
                 await createNotification({
                    recipientUid: post.creatorUid,
                    actorUid: user.uid,
                    actorName: user.name,
                    actorPhotoURL: user.photoURL,
                    type: parentId ? 'new_reply' : 'new_comment',
                    targetUrl: `/profile/${post.creatorUid}`, // Or a dedicated post page later
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
                        targetUrl: `/profile/${post.creatorUid}`, // Or a dedicated post page later
                        targetId: postId,
                    });
                }
            }
            return true;
        } catch (e) {
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
                        targetUrl: `/profile/${post.creatorUid}`, // Or a dedicated post page later
                        targetId: postId,
                    });
                }
            }
        }
    };


  const createGroup = async (groupData: { name: string; description: string; pin?: string }): Promise<boolean> => {
    if (!user) return false;
    
    try {
        const groupsRef = ref(db, 'groups');
        const newGroupRef = push(groupsRef);
        const newGroup: Omit<Group, 'id' | 'members'> = {
            name: groupData.name,
            description: groupData.description,
            creatorUid: user.uid,
            creatorName: user.name,
            hasPin: !!groupData.pin,
            pin: groupData.pin || null,
        };
        await set(newGroupRef, newGroup);
        // Automatically add creator as a member
        await set(ref(db, `groups/${newGroupRef.key}/members/${user.uid}`), true);
        return true;
    } catch(e) {
        return false;
    }
  };

  const joinGroup = async (groupId: string, pin?: string): Promise<boolean> => {
      if (!user) return false;
      const group = groups.find(g => g.id === groupId);
      if (!group) return false;

      // Check if user is already a member
      if (group.members?.includes(user.uid)) return true;

      // Check PIN if the group is private
      if (group.hasPin && group.pin !== pin) {
          return false;
      }

      try {
          const memberRef = ref(db, `groups/${groupId}/members/${user.uid}`);
          await set(memberRef, true);
          return true;
      } catch(e) {
          return false;
      }
  };

  const sendMessage = async (groupId: string, messageData: { content: string; type: 'text' } | { file: File; type: 'image' | 'audio' | 'video' | 'file' }): Promise<boolean> => {
    if (!user) return false;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;

    try {
        const messagesRef = ref(db, `groups/${groupId}/messages`);
        const newMessageRef = push(messagesRef);

        let messagePayload: Partial<Message> = {
            id: newMessageRef.key!,
            creatorUid: user.uid,
            creatorName: user.name,
            creatorPhotoURL: user.photoURL || '',
            timestamp: serverTimestamp() as any,
        };

        if (messageData.type === 'text') {
            messagePayload = {
                ...messagePayload,
                content: messageData.content,
                type: 'text',
            };
        } else {
            // Upload file to Firebase Storage
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
        }

        await set(newMessageRef, messagePayload);

        // Create notifications for all other group members
        const notificationPromises = group.members
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
            await update(messageRef, { content: newContent, isEdited: true });
            return true;
        } catch (e) {
            console.error("Error editing message:", e);
            return false;
        }
    };

    const deleteMessage = async (groupId: string, messageId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `groups/${groupId}/messages/${messageId}`);
            await remove(messageRef);
            return true;
        } catch (e) {
            console.error("Error deleting message:", e);
            return false;
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
        return conversationId;
    } else {
        const otherUser = allUsers.find(u => u.uid === otherUserId);
        if (!otherUser) return null;

        const newConversation: Conversation = {
            id: conversationId,
            participantUids: [user.uid, otherUserId],
            participants: {
                [user.uid]: { name: user.name, photoURL: user.photoURL || '' },
                [otherUserId]: { name: otherUser.name, photoURL: otherUser.photoURL || '' },
            },
            lastMessage: null,
            timestamp: serverTimestamp() as any,
        };

        try {
            await set(conversationRef, newConversation);
            // Add conversation ID to both users
            await set(ref(db, `users/${user.uid}/conversationIds/${conversationId}`), true);
            await set(ref(db, `users/${otherUserId}/conversationIds/${conversationId}`), true);
            return conversationId;
        } catch (error) {
            console.error("Error starting conversation:", error);
            return null;
        }
    }
  };

  const sendDirectMessage = async (conversationId: string, messageData: { content: string; type: 'text' } | { file: File; type: 'image' | 'audio' | 'video' | 'file' }): Promise<boolean> => {
    if (!user) return false;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return false;

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
            type: 'text' // default
        };

        if (messageData.type === 'text') {
            messagePayload = {
                ...messagePayload,
                content: messageData.content,
                type: 'text',
            };
        } else {
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
            await update(messageRef, { content: newContent, isEdited: true });
            return true;
        } catch (e) {
            console.error("Error editing direct message:", e);
            return false;
        }
    };

    const deleteDirectMessage = async (conversationId: string, messageId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const messageRef = ref(db, `conversations/${conversationId}/messages/${messageId}`);
            await remove(messageRef);
            return true;
        } catch (e) {
            console.error("Error deleting direct message:", e);
            return false;
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
    createGroup,
    joinGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    startConversation,
    sendDirectMessage,
    editDirectMessage,
    deleteDirectMessage,
    getConversationById,
    markNotificationsAsRead,
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

    