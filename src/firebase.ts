import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxECPWPIAB-xtj71ZYopgIiOtGTPUUbEY",
  authDomain: "project-9125872070194354033.firebaseapp.com",
  projectId: "project-9125872070194354033",
  storageBucket: "project-9125872070194354033.firebasestorage.app",
  messagingSenderId: "460065843621",
  appId: "1:460065843621:web:d7eb5573f481c02f40e04c"
};

const app = initializeApp(firebaseConfig);

// Use custom database ID from config
export const db = initializeFirestore(app, {
  databaseId: "ai-studio-8c3a590d-3c1c-4197-a7cd-e51a50abcf86"
} as any);

export interface LeaderboardEntry {
  id?: string;
  name: string;
  time: number;
  attempts: number;
  date: string;
  createdAt: Timestamp;
}

const LEADERBOARD_COLLECTION = 'leaderboard';

export async function fetchLeaderboardFromFirestore(): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      orderBy('time', 'asc'),
      orderBy('attempts', 'asc'),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        name: data.name,
        time: data.time,
        attempts: data.attempts,
        date: data.date,
        createdAt: data.createdAt,
      });
    });
    return entries;
  } catch (error) {
    console.error('Error fetching leaderboard from Firestore:', error);
    throw error;
  }
}

export async function addLeaderboardEntryToFirestore(name: string, time: number, attempts: number): Promise<LeaderboardEntry> {
  try {
    const entryData = {
      name: name,
      time: time,
      attempts: attempts,
      date: new Date().toLocaleDateString('zh-TW', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, LEADERBOARD_COLLECTION), entryData);
    return {
      id: docRef.id,
      ...entryData
    };
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    throw error;
  }
}
