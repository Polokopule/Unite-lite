
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Post } from "@/lib/types";
import type { Metadata } from "next";
import PostViewer from "./post-viewer";

type Props = {
  params: { id: string }
}

async function getPost(postId: string): Promise<Post | null> {
  try {
    const postRef = ref(db, `posts/${postId}`);
    const snapshot = await get(postRef);
    if (snapshot.exists()) {
      const postData = snapshot.val();
      // The data from firebase won't have the id in it, so we add it.
      return { id: postId, ...postData };
    }
    return null;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: "Post Not Found",
    }
  }

  const excerpt = post.content ? post.content.substring(0, 150) + '...' : "Check out this post on Unite.";
  const postUrl = `https://unite-app.dev/posts/${post.id}`;

  return {
    title: `${post.creatorName}: "${excerpt}" | Unite`,
    description: post.content,
    openGraph: {
      title: `${post.creatorName} on Unite`,
      description: excerpt,
      url: postUrl,
      images: post.fileUrl && post.fileType === 'image' ? [
        {
          url: post.fileUrl,
          width: 1200,
          height: 630,
          alt: post.content || 'Post image',
        },
      ] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.creatorName} on Unite`,
      description: excerpt,
      images: post.fileUrl && post.fileType === 'image' ? [post.fileUrl] : [],
    },
  }
}

export default function SinglePostPage({ params }: Props) {
    return <PostViewer postId={params.id} />;
}
