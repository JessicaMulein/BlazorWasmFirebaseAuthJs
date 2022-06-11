/// <reference types="node" />
import { FirebaseApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, User, UserInfo } from 'firebase/auth';
import { Database } from 'firebase/database';
import { FieldValue, Firestore } from 'firebase/firestore';
import { auth as firebaseUiAuth } from 'firebaseui';
interface IFirebaseJsDataDatabaseValue {
    state: string;
    last_changed: object;
}

interface IFirebaseJsDataFirestoreValue {
    state: string;
    last_changed: FieldValue;
}

interface IFirebaseJsData {
    allowAnonymous: boolean;
    anonymousUser?: User;
    anonymousUserData?: firestoreQuerySnapshot<firestoreDocumentData>;
    signedInUid?: string;
    lastUid?: string;
    presenceActive: boolean;
    isOfflineForDatabase?: () => IFirebaseJsDataDatabaseValue;
    isOnlineForDatabase?: () => IFirebaseJsDataDatabaseValue;
    isOfflineForFirestore?: () => IFirebaseJsDataFirestoreValue;
    isOnlineForFirestore?: () => IFirebaseJsDataFirestoreValue;
}

interface IFirebaseUiConfigSimple {
    signInOptions: Array<string>;
    signInSuccessUrl: string;
    tosUrl: string;
    privacyPolicyUrl: string;
}

interface IFirebaseJs {
    activatePresence: () => void;
    data: IFirebaseJsData;
    app?: FirebaseApp;
    auth?: Auth;
    authStateChanged: (user: User) => any;
    config?: object;
    createUserWithEmail: (email: string, password: string) => Promise<string | null>;
    database?: Database;
    dotNetFirebaseAuthReference?: DotNet.DotNetObject;
    firestore?: Firestore;
    fsListen: () => any;
    fsListenOnline: () => any;
    googleProvider?: GoogleAuthProvider;
    initialize: (dotNetObjectReference: DotNet.DotNetObject) => any;
    isInitialized: () => boolean;
    loginWithEmail: (email: string, password: string) => Promise<string | null>;
    loginWithGooglePopup: () => Promise<string | null>;
    rtdbPresence: () => any;
    rtdbAndLocalFsPresence: () => any;
    sendEmailVerification: () => Promise<boolean | null>;
    sendEmailPasswordReset: (email: string) => Promise<boolean>;
    setDatabaseUserStatus: (user: UserInfo, status: boolean) => any;
    setFirestoreUserStatus: (user: UserInfo, status: boolean) => any;
    signInAnonymously: () => Promise<any>;
    signOut: () => Promise<boolean>;
    ui?: firebaseUiAuth.AuthUI;
    uiConfigFromStorage?: IFirebaseUiConfigSimple;
    uiConfig?: firebaseUiAuth.Config;
    uiConfigFactory: () => firebaseUiAuth.Config;
    updateProfile: (userData: object) => Promise<any>;
}
