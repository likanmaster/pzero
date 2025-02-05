import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState('');
  const [initialWeight, setInitialWeight] = useState(null);
  const [targetWeight, setTargetWeight] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState('');
  const [currentHigh, setCurrentHigh] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  const calculateBmi = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    setBmi(bmiValue);
    setBmiCategory(getBmiCategory(bmiValue));
  };

  const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi >= 18.5 && bmi <= 24.9) return 'Peso normal';
    if (bmi >= 25.0 && bmi <= 29.9) return 'Sobrepeso';
    if (bmi >= 30.0 && bmi <= 34.9) return 'Obesidad grado I';
    if (bmi >= 35.0 && bmi <= 39.9) return 'Obesidad grado II';
    return 'Obesidad grado III';
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserName(userData.nombre);
            setProfileImage(userData.profileImage || '');
            setTargetWeight(userData.weightGoal);
            setCurrentHigh(userData.heigh);

            const weightHistory = userData.weightHistory;

            if (weightHistory && weightHistory.length > 0) {
              const firstWeight = weightHistory[0].weight;
              setInitialWeight(firstWeight);

              const lastWeight = weightHistory[weightHistory.length - 1].weight;
              setLatestWeight(lastWeight);

              calculateBmi(lastWeight, userData.heigh);
            }
          }
        }
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkMode ? '#000000' : '#4CAF50');
    }

    const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBarMeta) {
      appleStatusBarMeta.setAttribute('content', darkMode ? 'black' : 'default');
    }
  }, [darkMode]);

  const calculateProgress = () => {
    if (initialWeight === null || targetWeight === null || latestWeight === null) {
      return 0;
    }

    if (targetWeight < initialWeight) {
      const totalWeightToLose = initialWeight - targetWeight;
      const weightLost = initialWeight - latestWeight;
      const progress = (weightLost / totalWeightToLose) * 100;
      return Math.min(100, Math.max(0, progress));
    } else if (targetWeight > initialWeight) {
      const totalWeightToGain = targetWeight - initialWeight;
      const weightGained = latestWeight - initialWeight;
      const progress = (weightGained / totalWeightToGain) * 100;
      return Math.min(100, Math.max(0, progress));
    }

    return 100;
  };

  const progress = calculateProgress();

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="header">
        <h1>PesoZero</h1>
        <div className="profile-icon" onClick={toggleMenu}>
          {userName} &nbsp;
          {profileImage ? (
            <img src={profileImage} alt="Foto de perfil" className="profile-image" />
          ) : (
            <span>{userName} 👤</span>
          )}
        </div>
        {menuOpen && (
          <div className="user-menu open">
            <ul>
              <li onClick={toggleDarkMode}>Modo {darkMode ? 'Claro' : 'Oscuro'}</li>
              <li onClick={handleSignOut}>Cerrar sesión</li>
            </ul>
          </div>
        )}
      </header>

      <div className="card2">
        <h2>🎉 Bienvenido a PesoZero!</h2>
        {bmi !== null ? (
          <div className="bmi-summary">
            <p>
              Tu IMC es: <strong>{bmi}</strong> ({bmiCategory})
            </p>
          </div>
        ) : (
          <p>No hay datos suficientes para calcular el IMC.</p>
        )}
        <p> </p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <p> 🏆 Llevas : {progress.toFixed(2)}% para el peso objetivo</p>
      </div>
      <div className="cards-container">
        <Link to="/food-register" className="card food-card">
          <h2>🍎 Registro de Alimentos</h2>
          <p>Registra lo que comes y controla tus calorías.</p>
        </Link>
        <Link to="/meal-planner" className="card meal-card">
          <h2>📅 Planificador de Comidas</h2>
          <p>Crea planes de alimentación personalizados.</p>
        </Link>
        <Link to="/activity-tracker" className="card activity-card">
          <h2>🏃 Seguimiento de Actividad</h2>
          <p>Registra tu ejercicio y pasos diarios.</p>
        </Link>
        <Link to="/progress-stats" className="card stats-card">
          <h2>📊 Progreso y Estadísticas</h2>
          <p>Visualiza tu avance con gráficos y métricas.</p>
        </Link>
        <Link to="/ejercicios" className="card stats-card">
          <h2>🤾Recomensaciones de rutinas</h2>
          <p>Actividades sin equipamiento profesional</p> 
        </Link>
      </div>

      <footer className="footer">
        <Link to="/" className="footer-icon">
          🏠
        </Link>
        <Link to="/progress-stats" className="footer-icon">
          📊
        </Link>
        <Link to="/settings" className="footer-icon">
          ⚙️
        </Link>
      </footer>
    </div>
  );
};

export default Home;