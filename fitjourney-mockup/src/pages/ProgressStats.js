import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import './ProgressStats.css';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

function ProgressStats() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [activityCount, setActivityCount] = useState(0);
  const [weightData, setWeightData] = useState([]);
  const [caloriesSummary, setCaloriesSummary] = useState({
    consumed: 0,
    burned: 0,
    goal: 2000,
  });
  const [activityData, setActivityData] = useState({
    steps: 0,
    distance: 0,
    caloriesBurned: 0,
    activities: [],
  });
  const [streak, setStreak] = useState(0);
  const [weightComparison, setWeightComparison] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleWeightEntries, setVisibleWeightEntries] = useState(5);
  const [activityLevel, setActivityLevel] = useState('');

  const loadMoreWeightEntries = () => {
    setVisibleWeightEntries((prev) => prev + 5);
  };

  const calculateCaloriesBurned = (activity) => {
    const caloriesPerMinute = {
      Caminar: 5,
      Correr: 10,
      Bicicleta: 8,
      Natación: 9,
      Escalada: 11,
      Yoga: 4,
      Pilates: 5,
      Pesas: 6,
      Gimnasio: 7,
      Bailar: 6,
      Senderismo: 7,
      Patinaje: 8,
      Remo: 10,
      Boxeo: 12,
      Fútbol: 9,
      Básquetbol: 10,
      Tenis: 8,
      Golf: 4,
      Voleibol: 6,
      Esquí: 9,
      Snowboard: 8,
      Bicicross: 10,
      Triatlón: 13,
      Zumba: 7,
      CrossFit: 12,
      Jumping: 9,
      Kickboxing: 11,
      Surf: 7,
      Parapente: 5,
      Sentadillas: 7,
      Flexiones: 8,
      Plancha: 5,
      Burpees: 12,
      Zancadas: 7,
      ElevacionesDeCadera: 6,
      MountainClimbers: 10,
      AbTwists: 7,
      SaltosEnTijera: 8,
      JumpingJacks: 8,
      Escalera: 9,
      EscaladoresDeMontaña: 10,
      PuentesDeGluteos: 6,
      CirculosConLasPiernas: 5,
      AbTwistEnElSuelo: 7,
      SentadillasConSalto: 9,
      RodillazosAlPecho: 10,
      Tijeras: 6,
      ElevacionDePiernas: 7,
    };

    return (caloriesPerMinute[activity.name] || 0) * activity.duration;
  };

  const fetchCaloriesConsumed = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, 'food_register'),
        where('userId', '==', user.uid),
        where('date', '==', new Date().toISOString().split('T')[0])
      );

      const querySnapshot = await getDocs(q);
      let totalCaloriesConsumed = 0;

      querySnapshot.forEach((doc) => {
        const foodData = doc.data();
        totalCaloriesConsumed += parseFloat(foodData.totalCalories) || 0;
      });

      setCaloriesSummary((prev) => ({
        ...prev,
        consumed: totalCaloriesConsumed,
      }));
    } catch (error) {
      console.error('Error al obtener las calorías consumidas:', error);
    }
  };

  const getLast7Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };
  // Formatear el tiempo en horas y minutos
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserName(userData.nombre);
          setProfileImage(userData.profileImage || '');
          setAge(userData.edad);
          setGender(userData.gender);
          setHeight(userData.heigh);

          if (userData.weightHistory?.length > 0) {
            const formattedWeightData = userData.weightHistory
              .map((entry) => ({
                date: entry.date,
                weight: entry.weight,
              }))
              .sort((a, b) => new Date(b.date) - new Date(a.date));

            setWeightData(formattedWeightData);

            if (formattedWeightData.length >= 2) {
              const lastWeight = formattedWeightData[0].weight;
              setWeight(lastWeight);
              const secondLastWeight = formattedWeightData[1].weight;
              setWeightComparison(lastWeight < secondLastWeight ? 'happy' : 'sad');
            }
          }

          // Consulta simplificada
          const activitiesRef = collection(db, 'activities');
          const q = query(
            activitiesRef,
            where('userId', '==', user.uid)
          );

          const querySnapshot = await getDocs(q);

          let totalCaloriesBurned = 0;
          let totalSteps = 0;
          let totalDistance = 0;
          let allActivities = [];

          const today = new Date().toISOString().split('T')[0];
          const sevenDaysAgo = getLast7Days();

          querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Filtrar las actividades después de obtenerlas
            if (data.date >= sevenDaysAgo && data.date <= today) {
              const caloriesBurned = calculateCaloriesBurned({
                name: data.name,
                duration: data.duration,
              });

              // Solo sumar al total si es del día actual
              if (data.date === today) {
                totalCaloriesBurned += caloriesBurned;
                if (data.steps) totalSteps += data.steps;
                if (data.distance) totalDistance += data.distance;
              }

              allActivities.push({
                date: data.date,
                activity: data.name,
                duration: data.duration,
                caloriesBurned: caloriesBurned,
              });
            }
          });

          setActivityData({
            steps: totalSteps,
            distance: totalDistance,
            caloriesBurned: totalCaloriesBurned,
            activities: allActivities,
          });

          setCaloriesSummary((prev) => ({
            ...prev,
            burned: totalCaloriesBurned,
          }));

          await fetchCaloriesConsumed();
          await fetchStreak();
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.currentUser?.uid]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const fetchStreak = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, 'food_register'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      let registeredDates = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registeredDates.push(data.date);
      });

      if (registeredDates.length === 0) {
        setStreak(0);
        return;
      }

      registeredDates = registeredDates
        .map((date) => new Date(date))
        .sort((a, b) => b - a);

      let streakCount = 1;
      for (let i = 0; i < registeredDates.length - 1; i++) {
        const diff = (registeredDates[i] - registeredDates[i + 1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streakCount++;
        } else if (diff > 1) {
          break;
        }
      }

      setStreak(streakCount);
    } catch (error) {
      console.error('Error al calcular la racha:', error);
    }
  };
  const [totalActivityMinutes, setTotalActivityMinutes] = useState(0);
  const calculateActivityLevel = (activities) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const activeDays = new Set();
    let totalMinutes = 0;

    activities.forEach(activity => {
      const activityDate = new Date(activity.date);
      if (activityDate >= last7Days && activityDate <= today) {
        activeDays.add(activity.date);
        totalMinutes += activity.duration;
      }
    });

    const activityCount = activeDays.size;

    console.log('Días con actividad:', Array.from(activeDays));
    console.log('Número total de días activos:', activityCount);
    console.log('Minutos totales de actividad:', totalMinutes);

    let level = "Sedentario";
    if (activityCount >= 1 && activityCount <= 3) level = "Ligeramente activo";
    if (activityCount >= 4 && activityCount <= 5) level = "Moderadamente activo";
    if (activityCount >= 6) level = "Muy activo";

    return { activityLevel: level, activityCount, totalMinutes };
  };

  useEffect(() => {
    if (activityData.activities && activityData.activities.length > 0) {
      const { activityLevel: newActivityLevel, activityCount: newActivityCount, totalMinutes: newTotalMinutes } = calculateActivityLevel(activityData.activities);
      setActivityLevel(newActivityLevel);
      setActivityCount(newActivityCount);
      setTotalActivityMinutes(newTotalMinutes); // Nuevo estado para los minutos totales
    } else {
      setActivityLevel("Sedentario");
      setActivityCount(0);
      setTotalActivityMinutes(0); // Nuevo estado para los minutos totales
    }
  }, [activityData.activities]);

  const calculateBMR = (gender, weight, height, age) => {
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
    }
    return bmr;
  };

  const calculateTotalCalories = (bmr, activityLevel) => {
    const activityFactors = {
      Sedentario: 1.2,
      'Ligeramente activo': 1.375,
      'Moderadamente activo': 1.55,
      'Muy activo': 1.725,
    };
    return bmr * activityFactors[activityLevel];
  };

  const bmr = calculateBMR(gender, weight, height, age);
  const totalCalories = calculateTotalCalories(bmr, activityLevel);

  return (
    <div className="app">
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

      <div className="progress-stats">
        <h2>📊 Progreso y Estadísticas</h2>

        <div className="chart-container">
          <h3>
            {weightComparison === 'happy' && <p>¡Buen trabajo! 😀👍 haz bajado de peso</p>}
            {weightComparison === 'sad' && <p>¡Sigue intentándolo! 😔👎 has subido de peso</p>}
          </h3>
          <LineChart
            width={window.innerWidth < 500 ? 280 : 400}
            height={250}
            data={weightData}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
            <YAxis />
            <Tooltip formatter={(value) => `${value} kg`} labelFormatter={(label) => `Fecha: ${new Date(label).toLocaleDateString()}`} />
            <Legend />
            <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </div>

        <div className="calories-summary">
          <h3>Resumen de Calorías</h3>
          <p>
            Consumidas: {caloriesSummary.consumed.toFixed(2)} kcal | Quemadas: {caloriesSummary.burned} kcal
          </p>
          <p dangerouslySetInnerHTML={{

            __html: (caloriesSummary.consumed - caloriesSummary.burned) > 0 ?
              `😐 Debes quemar ${(caloriesSummary.consumed - caloriesSummary.burned).toFixed(2)} calorías hoy para mantener tu peso <br /> <br />Caminar 1 hora a paso normal equivale a quemar 350 calorías aprox.` :
              `😍¡Bien! Has quemado ${(caloriesSummary.burned - caloriesSummary.consumed).toFixed(2)} calorías más, vas bajando de peso`
          }} />
        </div>
        {/* Resumen de Peso */}
        <div className="weight-summary">
          <h3>Historial de Peso</h3>
          {weightData.length > 0 ? (
            <>
              {weightData.slice(0, visibleWeightEntries).map((entry, index) => (
                <div key={index}>
                  <p>
                    🗓️ {new Date(entry.date).toLocaleDateString()} | ⚖️ {entry.weight} kg
                  </p>
                </div>
              ))}
              {visibleWeightEntries < weightData.length && (
                <button onClick={loadMoreWeightEntries} className="load-more-button">
                  Ver más
                </button>
              )}
            </>
          ) : (
            <p>No hay datos de peso disponibles.</p>
          )}
        </div>

        {/* Resumen de Actividades */}
        <div className="activity-summary">
          <h3>Actividades Registradas hoy</h3>
          {activityData.activities
            .filter((activity) => {
              const activityDate = new Date(activity.date).toISOString().slice(0, 10);
              const today = new Date().toISOString().slice(0, 10);
              return activityDate === today;
            })
            .length > 0 ? (
            activityData.activities
              .filter((activity) => {
                const activityDate = new Date(activity.date).toISOString().slice(0, 10);
                const today = new Date().toISOString().slice(0, 10);
                return activityDate === today;
              })
              .map((activity, index) => (
                <div key={index}>
                  <p>
                    🏃‍♀️ {activity.activity} | ⏱️ {activity.duration} min | 🔥 {activity.caloriesBurned.toFixed(2)} kcal
                  </p>
                </div>
              ))
          ) : (
            <p>No hay actividades registradas hoy.</p>
          )}
        </div>

        {/* Resumen de Actividad Física */}
        <h3>Tu Consumo Calórico Base</h3>
        <p><strong>BMR:</strong> {bmr.toFixed(2)} kcal/día</p>
        <p><strong>Calorías totales:</strong> {totalCalories.toFixed(2)} kcal/día</p>
       {/*  <p><strong>Tu estado es:</strong> {activityLevel}</p> */}
        <p><strong>Días de actividad en los últimos 7 días:</strong> {activityCount}</p>
        <p>
          <strong>Minutos de actividad en los últimos 7 días:</strong> {formatTime(totalActivityMinutes)}
        </p>

        {/* Logros y Metas */}
        <div className="achievements">
          <h3>Logros</h3>
          <p>🏆 Llevas {streak} días consecutivos registrando comidas</p>
          {/*    <p>🏅 Has alcanzado el 60% de tu objetivo de pérdida de peso.</p> */}
        </div>
      </div>

      <footer className="footer">
        <Link to="/" className="footer-icon">🏠</Link>
        <Link to="/progress-stats" className="footer-icon"> </Link>
        <Link to="/settings" className="footer-icon">⚙️</Link>
      </footer>
    </div>
  );
}

export default ProgressStats;