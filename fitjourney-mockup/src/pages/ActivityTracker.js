import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import './ActivityTracker.css';

function ActivityTracker() {
  const navigate = useNavigate();

  // Estado para el formulario
  const [activityName, setActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [activities, setActivities] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Fecha por defecto: hoy
 const [profileImage, setProfileImage] = useState('');
  // Función para convertir minutos a horas y minutos
  const convertToHoursAndMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Redirigir al usuario si no ha iniciado sesión
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Obtener el nombre del usuario desde Firestore
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserName(userDocSnap.data().nombre);
          
          }
        }
      } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
      }
    };

    fetchUserName();
  }, []);
  /*para cargar foto de usuario*/
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setProfileImage(userData.profileImage || ''); // Cargar la imagen de perfil
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    };

    fetchUserData();
  }, []);
  // Cargar actividades desde Firebase al inicio o cuando se cambie la fecha
  useEffect(() => {
    const fetchActivities = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'activities'),
        where('userId', '==', user.uid),
        where('date', '==', selectedDate) // Filtrar por la fecha seleccionada
      );

      try {
        const querySnapshot = await getDocs(q);
        const activitiesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error al obtener actividades:', error);
      }
    };

    fetchActivities();
  }, [selectedDate]); // Vuelve a cargar las actividades cuando cambie la fecha seleccionada

  // Función para agregar una actividad
  const handleAddActivity = async (e) => {
    e.preventDefault();

    if (!activityName || !activityDuration) {
      alert('Por favor, completa ambos campos antes de agregar.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('No hay usuario autenticado.');
      return;
    }

    const newActivity = {
      userId: user.uid,
      name: activityName,
      duration: parseInt(activityDuration, 10),
      date: selectedDate, // Usar la fecha seleccionada
    };

    try {
      const docRef = await addDoc(collection(db, 'activities'), newActivity);
      setActivities([...activities, { id: docRef.id, ...newActivity }]);
      setActivityName('');
      setActivityDuration('');
    } catch (error) {
      console.error('Error al guardar la actividad en Firebase:', error);
    }
  };

  // Función para eliminar una actividad
  const handleDeleteActivity = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No hay usuario autenticado.');
        return;
      }

      const activityDocRef = doc(db, 'activities', id);
      const activityDocSnap = await getDoc(activityDocRef);
      if (!activityDocSnap.exists()) {
        console.error('La actividad no existe en Firestore.');
        return;
      }

      await deleteDoc(activityDocRef);
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== id)
      );
      console.log('Actividad eliminada correctamente de Firestore');
    } catch (error) {
      console.error('Error al eliminar la actividad:', error);
    }
  };

  // Calcular el total de tiempo de actividades
  const totalDuration = activities.reduce(
    (total, activity) => total + parseInt(activity.duration, 10),
    0
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>PesoZero</h1>
        <div className="profile-icon" onClick={() => setMenuOpen(!menuOpen)}>
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
              
              <li onClick={handleSignOut}>Cerrar sesión</li>
            </ul>
          </div>
        )}
      </header>


      {/* Contenido principal */}
      <div className="activity-tracker">
        <h2>🏋️‍♂️ Registro de Actividades</h2>

        {/* Selector de fecha */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {/* Formulario para agregar actividades */}
        <form onSubmit={handleAddActivity} className="activity-form">
          <select
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            required
          >
            <option value="">Selecciona una actividad</option>
            <option value="Caminar">🚶 Caminar</option>
            <option value="Correr">🏃 Correr/Trotar</option>
            <option value="Bicicleta">🚴 Andar en bicicleta</option>
            <option value="Natación">🏊 Natación</option>
            <option value="Escalada">🧗 Escalada</option>
            <option value="Yoga">🧘 Yoga</option>
            <option value="Pilates">💪 Pilates</option>
            <option value="Pesas">🏋️‍♂️ Entrenamiento con pesas</option>
            <option value="Gimnasio">🏋️‍♀️ Gimnasio/Cardio</option>
            <option value="Bailar">💃 Bailar</option>
            <option value="Senderismo">🥾 Senderismo</option>
            <option value="Patinaje">⛸️ Patinaje</option>
            <option value="Remo">🚣 Remo</option>
            <option value="Boxeo">🥊 Boxeo</option>
            <option value="Fútbol">⚽ Fútbol</option>
            <option value="Básquetbol">🏀 Básquetbol</option>
            <option value="Tenis">🎾 Tenis</option>
            <option value="Golf">⛳ Golf</option>
            <option value="Voleibol">🏐 Voleibol</option>
            <option value="Esquí">⛷️ Esquí</option>
            <option value="Snowboard">🏂 Snowboard</option>
            <option value="Bicicross">🚴‍♂️ Bicicross</option>
            <option value="Triatlón">🏊🚴🏃 Triatlón</option>
            <option value="Zumba">🕺 Zumba</option>
            <option value="CrossFit">🏋️‍♂️ CrossFit</option>
            <option value="Jumping">🤸 Jumping (Rebote en trampolines)</option>
            <option value="Kickboxing">🥊 Kickboxing</option>
            <option value="Surf">🏄 Surf</option>
            <option value="Parapente">🪂 Parapente</option>
          </select>


          <input
            type="number"
            placeholder="Duración (minutos)"
            value={activityDuration}
            onChange={(e) => setActivityDuration(e.target.value)}
            required
          />
          <button type="submit">Agregar Actividad</button>
        </form>

        {/* Lista de actividades */}
        <div className="activity-list">
          <h3>Actividades Registradas</h3>
          {activities.length === 0 ? (
            <p>No hay actividades registradas para este día.</p>
          ) : (
            <ul>
              {activities.map((activity) => (
                <li key={activity.id}>
                  <span>
                    {activity.name} - {activity.duration} min
                  </span>
                  <button onClick={() => handleDeleteActivity(activity.id)}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total de tiempo de actividades */}
        <div className="activity-summary">
          <p>
            Total de tiempo: <strong>{convertToHoursAndMinutes(totalDuration)}</strong>
          </p>
        </div>
      </div>

      {/* Footer */}
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
}

export default ActivityTracker;
