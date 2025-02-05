// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Opcional: Si usas Analytics
import { getFirestore } from "firebase/firestore"; // Para Firestore
import { getAuth } from "firebase/auth"; // Para autenticación

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAIbBdzxbpj8Gc_NeBuODiHoF-WbecuD1I",
  authDomain: "appdieta-fb96e.firebaseapp.com",
  projectId: "appdieta-fb96e",
  storageBucket: "appdieta-fb96e.appspot.com",
  messagingSenderId: "694991623380",
  appId: "1:694991623380:web:13a05dadd44889ec175741",
  measurementId: "G-QP92C9WG9J"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa los servicios que necesitas
const analytics = getAnalytics(app); // Opcional
const db = getFirestore(app); // Firestore
const auth = getAuth(app); // Autenticación

// Exporta los servicios para usarlos en tu aplicación
export { app, analytics, db, auth };