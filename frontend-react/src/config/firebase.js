import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAMJZTaQT7QiudYeATzVyx0UZaHaEs1QfA',
  authDomain: 'fund-ai-5f3ed.firebaseapp.com',
  projectId: 'fund-ai-5f3ed',
  storageBucket: 'fund-ai-5f3ed.firebasestorage.app',
  messagingSenderId: '794363632993',
  appId: '1:794363632993:web:f38bc22e9ce09786bdb920',
  measurementId: 'G-28N4QBXYZW'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
