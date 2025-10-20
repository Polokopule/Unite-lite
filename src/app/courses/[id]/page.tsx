
// This file is now dynamic by default and doesn't need getStaticProps or generateStaticParams

import type { Metadata } from "next";
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import type { Course } from "@/lib/types";
import CourseViewer from "./course-viewer";

type Props = {
  params: { id: string }
}

async function getCourse(courseId: string): Promise<Course | null> {
  try {
    const courseRef = ref(db, `courses/${courseId}`);
    const snapshot = await get(courseRef);
    if (snapshot.exists()) {
      return { id: courseId, ...snapshot.val() } as Course;
    }
    return null;
  } catch (error) {
    console.error("Error fetching course for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse(params.id);

  if (!course) {
    return {
      title: "Course Not Found",
      description: "The course you are looking for does not exist or may have been removed.",
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
    return <CourseViewer courseId={params.id} />;
}
