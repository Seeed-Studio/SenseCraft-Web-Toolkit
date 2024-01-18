import { getAnalytics, logEvent as _logEvent } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyC29Eoxbxk-vSfXr8R1WsyoXmyfkTcCIfA',
  authDomain: 'sensecraft-web-toolkit.firebaseapp.com',
  projectId: 'sensecraft-web-toolkit',
  storageBucket: 'sensecraft-web-toolkit.appspot.com',
  messagingSenderId: '735675280733',
  appId: '1:735675280733:web:656f1d11574b7a26530cb4',
  measurementId: 'G-5X90WMK2M7',
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
export function logEvent(
  eventName: string,
  eventParams?: {
    [key: string]: any;
  }
) {
  _logEvent(analytics, eventName, eventParams);
}

export default analytics;
