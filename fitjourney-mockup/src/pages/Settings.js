import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import './Settings.css';

function Settings() {
  const navigate = useNavigate();

  // Estados del formulario
  const [userName, setUserName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userGender, setUserGender] = useState('Male');
  const [weightGoal, setWeightGoal] = useState('');
  const [calorieLimit, setCalorieLimit] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [currentWeight, setCurrentWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [currentHigh, setCurrentHigh] = useState('');
  const [error, setError] = useState('');

  // Cargar datos del usuario desde Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserName(userData.nombre || '');
            setUserLastName(userData.apellido || '');
            setUserEmail(userData.email || '');
            setUserAge(userData.edad || '');
            setWeightGoal(userData.weightGoal || '');
            setCalorieLimit(userData.calorieLimit || '');
            setUserGender(userData.gender || 'Male');
            setNotificationsEnabled(userData.notificationsEnabled ?? true);
            setNotificationTime(userData.notificationTime || '08:00');
            setWeightHistory(userData.weightHistory || []);
            const lastWeightEntry = userData.weightHistory?.[userData.weightHistory.length - 1];
            setCurrentWeight(lastWeightEntry?.weight || '');
            setCurrentHigh(userData.heigh || '');
            setProfileImage(userData.profileImage || '');
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setError('Error al cargar los datos del usuario.');
      }
    };

    fetchUserData();
  }, []);

  // Subir imagen a Cloudinary
  const handleImageUpload = async (file) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No hay usuario autenticado.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'profile_images');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dfqyj1dub/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      const imageUrl = data.secure_url;

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profileImage: imageUrl,
      });

      setProfileImage(imageUrl);
      alert('Imagen de perfil actualizada correctamente.');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setError('Hubo un error al subir la imagen.');
    }
  };

  // Guardar datos en Firestore
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No hay usuario autenticado.');
        return;
      }

      // Validar campos numéricos
      if (isNaN(userAge) || isNaN(currentHigh) || isNaN(currentWeight) || isNaN(weightGoal) || isNaN(calorieLimit)) {
        setError('Por favor, ingresa valores numéricos válidos.');
        return;
      }

      const newWeightEntry = {
        weight: parseFloat(currentWeight),
        date: new Date().toISOString().split('T')[0],
      };

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        nombre: userName,
        apellido: userLastName,
        email: userEmail,
        edad: parseInt(userAge),
        weightGoal: parseFloat(weightGoal),
        calorieLimit: parseFloat(calorieLimit),
        gender: userGender,
        notificationsEnabled,
        notificationTime,
        weightHistory: arrayUnion(newWeightEntry),
        heigh: parseFloat(currentHigh),
      });

      setWeightHistory((prev) => [...prev, newWeightEntry]);
      alert('Configuración guardada correctamente.');
      setError('');
    } catch (error) {
      console.error('Error al actualizar la configuración:', error);
      setError('Hubo un error al guardar la configuración.');
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No hay usuario autenticado.');
        return;
      }

      if (newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }

      await updatePassword(user, newPassword);
      alert('Contraseña actualizada correctamente.');
      setNewPassword('');
      setError('');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setError('Debes volver a iniciar sesión para cambiar la contraseña.');
        navigate('/login');
      } else {
        console.error('Error al actualizar la contraseña:', error);
        setError('No se pudo actualizar la contraseña.');
      }
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Hubo un error al cerrar sesión.');
    }
  };

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

      <div className="settings">
        <div className="profile-image-container">
          <img src={profileImage} alt="Foto de perfil" className="profile-image-center" />
          <label className="edit-icon">
            ✏️
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSaveSettings} className="settings-form">
          {/* Resto del formulario */}
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ingresa tu nombre"
              required
            />
          </div>

          <div className="form-group">
            <label>Apellido:</label>
            <input
              type="text"
              value={userLastName}
              onChange={(e) => setUserLastName(e.target.value)}
              placeholder="Ingresa tu apellido"
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
            />
          </div>

          <div className="form-group">
            <label>Edad:</label>
            <input
              type="number"
              value={userAge}
              onChange={(e) => setUserAge(e.target.value)}
              placeholder="Ingresa tu edad"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Género:</label>
            <select value={userGender} onChange={(e) => setUserGender(e.target.value)}>
              <option value="Male">Masculino</option>
              <option value="Female">Femenino</option>
            </select>
          </div>

          <div className="form-group">
            <label>Altura (cm):</label>
            <input
              type="number"
              value={currentHigh}
              onChange={(e) => setCurrentHigh(e.target.value)}
              placeholder="Ej: 170"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Peso Actual (kg):</label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="Ej: 70"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Objetivo de Peso (kg):</label>
            <input
              type="number"
              value={weightGoal}
              onChange={(e) => setWeightGoal(e.target.value)}
              placeholder="Ej: 65"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Límite Diario de Calorías:</label>
            <input
              type="number"
              value={calorieLimit}
              onChange={(e) => setCalorieLimit(e.target.value)}
              placeholder="Ej: 2000"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              Activar Notificaciones
            </label>
          </div>

          {notificationsEnabled && (
            <div className="form-group">
              <label>Horario de Notificaciones:</label>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Nueva Contraseña:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa la nueva contraseña"
            />
            <button type="button" onClick={handleChangePassword}>
              Cambiar Contraseña
            </button>
          </div>

          <button type="submit">Guardar Cambios</button>
        </form>
      </div>

      <footer className="footer">
        <Link to="/" className="footer-icon">🏠</Link>
        <Link to="/progress-stats" className="footer-icon">📊</Link>
        <Link to="/settings" className="footer-icon">⚙️</Link>
      </footer>
    </div>
  );
}

export default Settings;