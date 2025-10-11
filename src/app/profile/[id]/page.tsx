
import { db } from "@/lib/firebase";
import { User } from "@/lib/types";
import { get, ref } from "firebase/database";
import ProfilePageClient from "./profile-page-client";

type Props = {
  params: { id: string }
}

export async function generateStaticParams() {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
        return [];
    }
    const users = snapshot.val();
    return Object.keys(users).map((userId) => ({
        id: userId,
    }));
}

export default function ProfilePage({ params }: Props) {
    return <ProfilePageClient profileUserId={params.id} />;
}
