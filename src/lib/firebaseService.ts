import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Internship, UserProfile, TrackedInternship, ActionPlan } from "../types";

// Collection Names
const USERS_COL = "users";
const TRACKED_COL = "tracked_internships";
const SCANNED_COL = "scanned_internships";
const PLANS_COL = "action_plans";

// Fallbacks for Local Storage when Guest
const LOCAL_PROFILE_KEY = "internready_profile";
const LOCAL_TRACKED_KEY = "internready_tracked";
const LOCAL_PLANS_KEY = "internready_plans";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Operations
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COL, uid);
    await setDoc(userRef, profile, { merge: true });
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${uid}`);
    }
    console.error("Firebase error saving profile:", error);
    // Local fallback
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.GET, `${USERS_COL}/${uid}`);
    }
    console.error("Firebase error getting profile:", error);
    const local = localStorage.getItem(LOCAL_PROFILE_KEY);
    return local ? JSON.parse(local) : null;
  }
}

// Tracked Internship Operations
export async function trackInternship(uid: string, internshipId: string, customNotes = ""): Promise<TrackedInternship> {
  const id = `${uid}_${internshipId}`;
  const tracked: TrackedInternship = {
    id,
    userId: uid,
    internshipId,
    addedAt: new Date().toISOString(),
    notes: customNotes,
    isApplied: false,
    remindersEnabled: true
  };

  if (uid === "guest" || !auth.currentUser) {
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    const list: TrackedInternship[] = local ? JSON.parse(local) : [];
    if (!list.some(t => t.id === id)) {
      list.push(tracked);
      localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
    }
    return tracked;
  }

  try {
    const docRef = doc(db, TRACKED_COL, id);
    await setDoc(docRef, tracked);
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.CREATE, `${TRACKED_COL}/${id}`);
    }
    console.error("Firebase error tracking internship:", error);
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    const list: TrackedInternship[] = local ? JSON.parse(local) : [];
    if (!list.some(t => t.id === id)) {
      list.push(tracked);
      localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
    }
  }
  return tracked;
}

export async function untrackInternship(uid: string, internshipId: string): Promise<void> {
  const id = `${uid}_${internshipId}`;
  if (uid === "guest" || !auth.currentUser) {
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    if (local) {
      let list: TrackedInternship[] = JSON.parse(local);
      list = list.filter(t => t.id !== id);
      localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
    }
    return;
  }

  try {
    const docRef = doc(db, TRACKED_COL, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.DELETE, `${TRACKED_COL}/${id}`);
    }
    console.error("Firebase error untracking:", error);
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    if (local) {
      let list: TrackedInternship[] = JSON.parse(local);
      list = list.filter(t => t.id !== id);
      localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
    }
  }
}

export async function updateTrackedDetails(uid: string, internshipId: string, updates: Partial<TrackedInternship>): Promise<void> {
  const id = `${uid}_${internshipId}`;
  if (uid === "guest" || !auth.currentUser) {
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    if (local) {
      const list: TrackedInternship[] = JSON.parse(local);
      const index = list.findIndex(t => t.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
      }
    }
    return;
  }

  try {
    const docRef = doc(db, TRACKED_COL, id);
    await updateDoc(docRef, updates);
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.UPDATE, `${TRACKED_COL}/${id}`);
    }
    console.error("Firebase error updating tracked details:", error);
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    if (local) {
      const list: TrackedInternship[] = JSON.parse(local);
      const index = list.findIndex(t => t.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updates };
        localStorage.setItem(LOCAL_TRACKED_KEY, JSON.stringify(list));
      }
    }
  }
}

export async function getTrackedInternships(uid: string): Promise<TrackedInternship[]> {
  if (uid === "guest" || !auth.currentUser) {
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    return local ? JSON.parse(local) : [];
  }

  try {
    const q = query(collection(db, TRACKED_COL), where("userId", "==", uid));
    const snap = await getDocs(q);
    const result: TrackedInternship[] = [];
    snap.forEach(doc => {
      result.push(doc.data() as TrackedInternship);
    });
    return result;
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.LIST, TRACKED_COL);
    }
    console.error("Firebase error getting tracked list:", error);
    const local = localStorage.getItem(LOCAL_TRACKED_KEY);
    return local ? JSON.parse(local) : [];
  }
}

// Scanned Internship Cache (Global for all students)
export async function cacheScannedInternships(internships: Internship[]): Promise<void> {
  try {
    for (const internship of internships) {
      const docRef = doc(db, SCANNED_COL, internship.id);
      await setDoc(docRef, internship, { merge: true });
    }
  } catch (error: any) {
    console.warn("Skipping scanned internship cache due to Firestore permissions:", error);
  }
}

export async function getGlobalScannedInternships(): Promise<Internship[]> {
  try {
    const snap = await getDocs(collection(db, SCANNED_COL));
    const result: Internship[] = [];
    snap.forEach(doc => {
      result.push(doc.data() as Internship);
    });
    return result;
  } catch (error: any) {
    console.warn("Firebase error loading cached list:", error);
    return [];
  }
}

// Action Plan Operations
export async function saveActionPlan(plan: ActionPlan): Promise<void> {
  const id = `${plan.userId}_${plan.internshipId}`;
  try {
    const docRef = doc(db, PLANS_COL, id);
    await setDoc(docRef, plan);
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.WRITE, `${PLANS_COL}/${id}`);
    }
    console.error("Firebase error saving action plan:", error);
    const local = localStorage.getItem(LOCAL_PLANS_KEY);
    const list: ActionPlan[] = local ? JSON.parse(local) : [];
    const index = list.findIndex(p => p.userId === plan.userId && p.internshipId === plan.internshipId);
    if (index !== -1) {
      list[index] = plan;
    } else {
      list.push(plan);
    }
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(list));
  }
}

export async function getActionPlan(uid: string, internshipId: string): Promise<ActionPlan | null> {
  const id = `${uid}_${internshipId}`;
  try {
    const docRef = doc(db, PLANS_COL, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ActionPlan;
    }
    return null;
  } catch (error: any) {
    if (error?.code === "permission-denied" || error?.message?.includes("permissions") || error?.message?.includes("Permissions")) {
      handleFirestoreError(error, OperationType.GET, `${PLANS_COL}/${id}`);
    }
    console.error("Firebase error getting action plan:", error);
    const local = localStorage.getItem(LOCAL_PLANS_KEY);
    if (local) {
      const list: ActionPlan[] = JSON.parse(local);
      const found = list.find(p => p.userId === uid && p.internshipId === internshipId);
      return found || null;
    }
    return null;
  }
}
