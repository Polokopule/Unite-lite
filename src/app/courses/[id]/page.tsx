

import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Course } from "@/lib/types";
import type { Metadata } from "next";
import CourseViewer from "./course-viewer";

type Props = {
  params: { id: string }
}

// Function to fetch a single course from Firebase
async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const courseRef = ref(db, `courses/${courseId}`);
    const snapshot = await get(courseRef);
    if (snapshot.exists()) {
      return { id: courseId, ...snapshot.val() } as Course;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse(params.id);

  if (!course) {
    return {
      title: "Course Not Found",
    }
  }

  const excerpt = course.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

  return {
    title: `${course.title} | Unite`,
    description: excerpt,
    openGraph: {
      title: course.title,
      description: excerpt,
      images: [
        {
          url: course.imageUrl,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: excerpt,
      images: [course.imageUrl],
    },
  }
}

export default function CourseViewerPage({ params }: Props) {
    // This is now a Server Component that wraps the client component
    // It passes the courseId to the client component which will handle its own data fetching and logic
    return <CourseViewer courseId={params.id} />;
}
