import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import axios from 'axios';
import './MealPlanner.css';

function MealPlanner() {
  const navigate = useNavigate();

  // Estado para el formulario
  const [mealType, setMealType] = useState('desayuno');
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [meals, setMeals] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [profileImage, setProfileImage] = useState('');
  const [registeredMeals, setRegisteredMeals] = useState({}); // Estado para rastrear comidas registradas

  // Credenciales de la API de Nutritionix
  const NUTRITIONIX_APP_ID = '4aee0116';
  const NUTRITIONIX_APP_KEY = '332d74c4f88e8ed919dbea5912da15a3';

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

  // Obtener el nombre y la imagen de perfil del usuario desde Firestore
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
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      }
    };

    fetchUserData();
  }, []);

  // Cargar comidas y comidas registradas desde Firebase al inicio
  useEffect(() => {
    const fetchMealsAndRegisteredMeals = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Cargar comidas planificadas
      const q = query(
        collection(db, 'meals'),
        where('userId', '==', user.uid),
        where('date', '==', new Date().toISOString().split('T')[0])
      );

      try {
        const querySnapshot = await getDocs(q);
        const mealsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMeals(mealsData);
      } catch (error) {
        console.error('Error al obtener comidas:', error);
      }

      // Cargar comidas registradas
      const registeredMealsQuery = query(
        collection(db, 'food_register'),
        where('userId', '==', user.uid),
        where('date', '==', new Date().toISOString().split('T')[0])
      );

      try {
        const registeredMealsSnapshot = await getDocs(registeredMealsQuery);
        const registeredMealsData = {};
        registeredMealsSnapshot.forEach((doc) => {
          const meal = doc.data();
          registeredMealsData[meal.name] = true; // Usamos el nombre de la comida como clave
        });
        setRegisteredMeals(registeredMealsData);
      } catch (error) {
        console.error('Error al obtener comidas registradas:', error);
      }
    };

    fetchMealsAndRegisteredMeals();
  }, []);

  // Buscar sugerencias de alimentos usando la API de Nutritionix
  const fetchFoodSuggestions = async (query) => {
    try {
      const response = await axios.get(
        `https://trackapi.nutritionix.com/v2/search/instant?query=${query}`,
        {
          headers: {
            'x-app-id': NUTRITIONIX_APP_ID,
            'x-app-key': NUTRITIONIX_APP_KEY,
          },
        }
      );

      setSuggestions(response.data.common || []);
    } catch (error) {
      console.error('Error al buscar sugerencias de alimentos:', error);
    }
  };

  // Obtener las calorías de un alimento usando la API de Nutritionix
  const fetchFoodCalories = async (foodName) => {
    try {
      const response = await axios.post(
        'https://trackapi.nutritionix.com/v2/natural/nutrients',
        {
          query: foodName,
        },
        {
          headers: {
            'x-app-id': NUTRITIONIX_APP_ID,
            'x-app-key': NUTRITIONIX_APP_KEY,
          },
        }
      );

      if (response.data.foods && response.data.foods.length > 0) {
        const calories = response.data.foods[0].nf_calories;
        setMealCalories(calories || 'N/A');
      }
    } catch (error) {
      console.error('Error al obtener las calorías:', error);
    }
  };

  // Manejar cambios en el campo de nombre de la comida
  const handleMealNameChange = (e) => {
    const value = e.target.value;
    setMealName(value);

    if (value.length > 2) {
      fetchFoodSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  // Seleccionar una sugerencia de alimento
  const handleSelectSuggestion = (food) => {
    setMealName(food.food_name);
    setSuggestions([]);
    fetchFoodCalories(food.food_name);
  };

  // Función para agregar una comida
  const handleAddMeal = async (e) => {
    e.preventDefault();

    if (!mealName) {
      alert('Por favor, ingresa el nombre de la comida.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('No hay usuario autenticado.');
      return;
    }

    const newMeal = {
      userId: user.uid,
      type: mealType,
      name: mealName,
      calories: mealCalories || 0,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const docRef = await addDoc(collection(db, 'meals'), newMeal);
      setMeals([...meals, { id: docRef.id, ...newMeal }]);
      setMealName('');
      setMealCalories('');
    } catch (error) {
      console.error('Error al guardar la comida en Firebase:', error);
    }
  };

  // Función para eliminar una comida
  const handleDeleteMeal = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No hay usuario autenticado.');
        return;
      }

      const mealDocRef = doc(db, 'meals', id);
      const mealDocSnap = await getDoc(mealDocRef);
      if (!mealDocSnap.exists()) {
        console.error('La comida no existe en Firestore.');
        return;
      }

      await deleteDoc(mealDocRef);
      setMeals((prevMeals) => prevMeals.filter((meal) => meal.id !== id));
      console.log('Comida eliminada correctamente de Firestore');
    } catch (error) {
      console.error('Error al eliminar la comida:', error);
    }
  };

  // Función para agregar la comida cuando se presiona el botón "Agregar"
  const handleAddMealForDay = async (meal) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('No hay usuario autenticado.');
        return;
      }

      const newMeal = {
        userId: user.uid,
        type: meal.type,
        name: meal.name,
        calories: meal.calories || 0,
        totalCalories: meal.calories || 0,
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
      };

      // Guardar la comida en Firestore
      const docRef = await addDoc(collection(db, 'food_register'), newMeal);

      // Marcar la comida como registrada
      setRegisteredMeals((prev) => ({
        ...prev,
        [meal.name]: true, // Usamos el nombre de la comida como clave
      }));

      alert('Comida registrada correctamente');
    } catch (error) {
      console.error('Error al agregar la comida:', error);
    }
  };

  // Calcular el total de calorías
  const totalCalories = meals.reduce((total, meal) => {
    return total + (parseInt(meal.calories) || 0);
  }, 0);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>PesoZero</h1>
        <div className="profile-icon" onClick={() => setMenuOpen(!menuOpen)}>
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

      {/* Contenido de la pantalla de planificador de comidas */}
      <div className="meal-planner">
        <h2>📅 Planificador de Comidas</h2>

        {/* Formulario para agregar comidas */}
        <form onSubmit={handleAddMeal} className="meal-form">
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
            <option value="desayuno">Desayuno</option>
            <option value="almuerzo">Almuerzo</option>
            <option value="cena">Cena</option>
            <option value="snack">Snack</option>
          </select>
          <input
            type="text"
            placeholder="Nombre de la comida"
            value={mealName}
            onChange={handleMealNameChange}
            required
          />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((food, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSelectSuggestion(food)}
                >
                  {food.food_name}
                </div>
              ))}
            </div>
          )}
          <input
            type="number"
            placeholder="Calorías (opcional)"
            value={mealCalories}
            onChange={(e) => setMealCalories(e.target.value)}
          />
          <button type="submit">Agregar</button>
        </form>

        {/* Lista de comidas planificadas */}
        <div className="meal-list">
          <h3>Comidas Planificadas</h3>
          {meals.length === 0 ? (
            <p>No hay comidas planificadas.</p>
          ) : (
            <ul>
              {meals.map((meal) => (
                <li key={meal.id}>
                  <span>
                    {meal.type}: {meal.name} - {meal.calories} kcal
                  </span>
                  <button className="delete-btn" onClick={() => handleDeleteMeal(meal.id)}>
                    Eliminar
                  </button>

                  <button
                    onClick={() => handleAddMealForDay(meal)}
                    disabled={registeredMeals[meal.name]}
                    className={registeredMeals[meal.name] ? 'disabled-button' : ''}
                  >
                    {registeredMeals[meal.name] ? 'Registrada' : 'Agregar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Resumen de Calorías Totales */}
        <div className="calories-summary">
          <p>
            Total de Calorías Planificadas: <strong>{totalCalories} kcal</strong>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <Link to="/" className="footer-icon">🏠</Link>
        <Link to="/progress-stats" className="footer-icon">📊</Link>
        <Link to="/settings" className="footer-icon">⚙️</Link>
      </footer>
    </div>
  );
}

export default MealPlanner;