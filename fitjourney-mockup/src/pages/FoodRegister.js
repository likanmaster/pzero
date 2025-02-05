import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import axios from 'axios'; // Importa axios para hacer solicitudes HTTP
import './FoodRegister.css';

function FoodRegister() {
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [foodList, setFoodList] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // Sugerencias de alimentos
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Fecha por defecto: hoy
  const navigate = useNavigate();

  // Credenciales de la API de Nutritionix
  const NUTRITIONIX_APP_ID = '4aee0116'; // Reemplaza con tu App ID
  const NUTRITIONIX_APP_KEY = '332d74c4f88e8ed919dbea5912da15a3'; // Reemplaza con tu App Key

  // Cerrar sesión
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

  // Cargar alimentos desde Firebase al inicio o cuando se cambie la fecha
  useEffect(() => {
    const fetchFoods = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'food_register'),
        where('userId', '==', user.uid),
        where('date', '==', selectedDate) // Filtrar por la fecha seleccionada
      );

      try {
        const querySnapshot = await getDocs(q);
        const foods = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoodList(foods);
      } catch (error) {
        console.error('Error al obtener alimentos:', error);
      }
    };

    fetchFoods();
  }, [selectedDate]); // Vuelve a cargar los alimentos cuando cambie la fecha seleccionada

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

      // Obtener las sugerencias de alimentos
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

      // Obtener las calorías del primer resultado
      if (response.data.foods && response.data.foods.length > 0) {
        const calories = response.data.foods[0].nf_calories;
        setCalories(calories || 'N/A');
      }
    } catch (error) {
      console.error('Error al obtener las calorías:', error);
    }
  };

  // Manejar cambios en el campo de nombre del alimento
  const handleFoodNameChange = (e) => {
    const value = e.target.value;
    setFoodName(value);

    // Buscar sugerencias si el usuario escribe más de 2 caracteres
    if (value.length > 2) {
      fetchFoodSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  // Seleccionar una sugerencia de alimento
  const handleSelectSuggestion = (food) => {
    setFoodName(food.food_name);
    setSuggestions([]); // Limpiar sugerencias
    fetchFoodCalories(food.food_name); // Obtener las calorías automáticamente
  };

  // Agregar un alimento
  const handleAddFood = async (e) => {
    e.preventDefault();

    if (!foodName || !quantity) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('No hay usuario autenticado.');
      return;
    }

    const newFood = {
      userId: user.uid,
      date: selectedDate, // Usar la fecha seleccionada
      name: foodName,
      quantity: quantity,
      calories: calories || 'N/A',
      totalCalories: quantity * (parseFloat(calories) || 0) // Aquí se calcula el total de calorías
    };

    try {
      const docRef = await addDoc(collection(db, 'food_register'), newFood);
      setFoodList([...foodList, { id: docRef.id, ...newFood }]);

      // Limpiar formulario
      setFoodName('');
      setQuantity('');
      setCalories('');
    } catch (error) {
      console.error('Error al guardar en Firebase:', error);
    }
  };

  // Eliminar un alimento
  const handleDeleteFood = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No hay usuario autenticado.');
        return;
      }

      const foodDocRef = doc(db, 'food_register', id);
      const foodDocSnap = await getDoc(foodDocRef);
      if (!foodDocSnap.exists()) {
        console.error('El alimento no existe en Firestore.');
        return;
      }

      await deleteDoc(foodDocRef);
      setFoodList((prevList) => prevList.filter((food) => food.id !== id));
      console.log('Alimento eliminado correctamente de Firestore');
    } catch (error) {
      console.error('Error al eliminar el alimento:', error);
    }
  };
  /*para cargar foto de usuario*/
   const [profileImage, setProfileImage] = useState('');
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
  // Calcular el total de calorías
  const totalCalories = foodList.reduce((total, food) => {
    return total + (parseInt(food.calories) || 0);
  }, 0);

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


      {/* Contenido de la pantalla de registro de alimentos */}
      <div className="food-register">
        <h2>🍎 Registro de Alimentos</h2>

        {/* Selector de fecha */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        {/* Formulario de Registro */}
        <form onSubmit={handleAddFood} className="food-form">
          <input
            type="text"
            placeholder="Nombre del alimento"
            value={foodName}
            onChange={handleFoodNameChange}
            required
          />
          {/* Mostrar sugerencias de alimentos */}
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
            type="text"
            placeholder="Cantidad 1 = 100 gramos"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Calorías (opcional)"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
          <button type="submit">Agregar</button>
        </form>

        {/* Lista de Alimentos Registrados */}
        <div className="food-list">
          <h3>Alimentos Registrados</h3>
          {foodList.length === 0 ? (
            <p>No hay alimentos registrados para este día.</p>
          ) : (
            <ul>
              {foodList.map((food) => (
                <li key={food.id}>
                  <span>
                    {food.name} - {food.quantity} - {food.totalCalories} kcal
                  </span>
                  <button onClick={() => handleDeleteFood(food.id)}>Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Resumen de Calorías */}
        <div className="calories-summary">
          <p>
            Total de Calorías: <strong>{totalCalories} kcal</strong>
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

export default FoodRegister;