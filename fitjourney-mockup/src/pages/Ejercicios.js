import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, deleteDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import './Ejercicios.css';

function Ejercicios() {
    const navigate = useNavigate();
    // Estado para el formulario
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [exercises, setExercises] = useState([]); // Estado para los ejercicios recomendados
    const [selectedExercise, setSelectedExercise] = useState(null); // Estado para el ejercicio seleccionado
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal

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

    // Cargar foto de usuario
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
    // Estados para el cronómetro
    const [time, setTime] = useState(0); // Tiempo en segundos
    const [isRunning, setIsRunning] = useState(false); // Estado del cronómetro

    // Función para iniciar/pausar el cronómetro
    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    // Función para reiniciar el cronómetro
    const resetTimer = () => {
        setTime(0);
        setIsRunning(false);
    };

    // Efecto para actualizar el cronómetro cada segundo
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Formatear el tiempo en minutos y segundos
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    function minutoos(seconds) {
        return Math.round(seconds / 60);
    }
    // Simulación de datos de ejercicios recomendados
    const recommendedExercises = [
        {
            id: 1,
            name: 'Sentadillas',
            description: 'Ejercicio para fortalecer piernas y glúteos.',
            detailedDescription:
                'Párate con los pies separados al ancho de los hombros. Baja tu cuerpo como si te sentaras en una silla, manteniendo la espalda recta. Luego, vuelve a la posición inicial.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsUsKwqyT53lxXcYQjlm131iRUBsgetV1ouA&s',
            video: 'https://www.youtube.com/embed/80dKqPruEMo?si=4TC5tm7sr_J2vEz',
            descripcion: 'hacer 5 minutos este ejercicio equivale a 100 kal.',
        },
        {
            id: 2,
            name: 'Flexiones',
            description: 'Ejercicio para fortalecer brazos, pecho y hombros.',
            detailedDescription:
                'Colócate en posición de plancha con las manos apoyadas en el suelo. Baja tu cuerpo hasta que el pecho casi toque el suelo, luego empuja hacia arriba hasta extender los brazos.',
            image: 'https://static.strengthlevel.com/images/exercises/push-ups/push-ups-800.jpg',
            video: 'https://www.youtube.com/embed/abc456',
        },
        {
            id: 3,
            name: 'Plancha',
            description: 'Ejercicio para fortalecer el core y mejorar la postura.',
            detailedDescription:
                'Colócate en posición de plancha con los codos apoyados en el suelo. Mantén el cuerpo recto y contrae los músculos del core. Aguanta la posición durante el tiempo indicado.',
            image: 'https://cdn0.uncomo.com/es/posts/4/0/9/hacer_planchas_abdominales_ayuda_a_quemar_grasa_52904_orig.jpg',
            video: 'https://www.youtube.com/embed/def789',
        },
        {
            id: 4,
            name: 'Burpees',
            description: 'Ejercicio completo que combina fuerza y cardio.',
            detailedDescription:
                'Comienza de pie, luego agáchate y coloca las manos en el suelo. Lanza los pies hacia atrás para quedar en posición de plancha, haz una flexión, lleva los pies hacia adelante y salta explosivamente.',
            image: 'https://images.healthshots.com/healthshots/en/uploads/2023/03/16013822/Burpees-1600x900.jpg',
            video: 'https://www.youtube.com/embed/ghi012',
        },
        {
            id: 5,
            name: 'Zancadas',
            description: 'Ejercicio para fortalecer piernas y glúteos.',
            detailedDescription:
                'Da un paso hacia adelante con una pierna y baja el cuerpo hasta que ambas piernas estén dobladas a 90 grados. Luego, regresa a la posición inicial y repite con la otra pierna.',
            image: 'https://media.vogue.es/photos/5ff6eec72361f90ef2d5de21/master/w_1600,c_limit/zancasas.jpg',
            video: 'https://www.youtube.com/embed/zsMnU2RvnM8',
        },
        {
            id: 6,
            name: 'Elevaciones de cadera',
            description: 'Ejercicio para fortalecer glúteos y abdomen.',
            detailedDescription:
                'Acuéstate en el suelo con las piernas dobladas y los pies apoyados. Levanta las caderas hacia el techo apretando los glúteos, mantén un segundo y baja lentamente.',
            image: 'https://i0.wp.com/pilicuadrado.com/wp-content/uploads/2015/03/elevacion-cadera-pies-appoyados_thumb_e.jpg?w=640&ssl=1',
            video: 'https://www.youtube.com/embed/KFwChX7C22I',
        },
        {
            id: 7,
            name: 'Mountain Climbers',
            description: 'Ejercicio de cardio que fortalece el core, piernas y hombros.',
            detailedDescription:
                'Colócate en posición de plancha y lleva una rodilla hacia el pecho, luego cambia rápidamente a la otra pierna, imitando el movimiento de escalar.',
            image: 'https://images.ctfassets.net/hjcv6wdwxsdz/1WCM5ZFQUTUvuDohwMqr3B/f9b0d7e0eefafd21806937e72b2f867e/mountain-climbers.png?w=1200',
            video: 'https://www.youtube.com/embed/KU6tZt0pRb8',
        },
        {
            id: 8,
            name: 'Ab twists',
            description: 'Ejercicio para fortalecer los oblicuos (parte lateral del abdomen).',
            detailedDescription:
                'Siéntate con las piernas ligeramente flexionadas y los pies elevados. Gira el torso de un lado al otro mientras mantienes los abdominales contraídos.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV-quzP5jE9wEbuoHiPHKJmXRElf1CdK6U2Q&s',
            video: 'https://www.youtube.com/embed/O1h4szQ6NlE',
        },
        {
            id: 9,
            name: 'Saltos en tijera',
            description: 'Ejercicio para mejorar la coordinación y trabajar piernas y glúteos.',
            detailedDescription:
                'Comienza de pie, da un salto hacia adelante con una pierna y al mismo tiempo lleva la otra hacia atrás. Salta y cambia de pierna rápidamente.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0Nrw7-Kyc9FDEoKsnaH16kT8I6fbkwMhQAQ&s',
            video: 'https://www.youtube.com/embed/QJ1zxjlxxDg',
        },
        {
            id: 10,
            name: 'Jumping Jacks',
            description: 'Ejercicio cardiovascular que trabaja todo el cuerpo.',
            detailedDescription:
                'Comienza de pie con las piernas juntas y las manos a los lados. Salta y abre las piernas mientras levantas los brazos por encima de la cabeza. Luego, salta nuevamente a la posición inicial.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEirWQ6sQls_yDFSQKjDCgVcqz610WPan0JQ&s',
            video: 'https://www.youtube.com/embed/P6t9g0oCk9M',
        },
        {
            id: 11,
            name: 'Escalera',
            description: 'Ejercicio cardiovascular y de piernas.',
            detailedDescription:
                'Sube y baja escaleras (si tienes disponibles) o usa un banco. Asegúrate de mantener el core contraído y realiza el movimiento de manera controlada.',
            image: 'https://media.tycsports.com/files/2024/11/15/787299/escaleras.webp',
            video: 'https://www.youtube.com/embed/9O3s55vbhFQ',
        },
        {
            id: 12,
            name: 'Escaladores de montaña',
            description: 'Ejercicio de cardio y fortalecimiento de piernas.',
            detailedDescription:
                'En posición de plancha, lleva una rodilla hacia el pecho y alterna rápidamente las piernas en un movimiento similar al de escalar.',
            image: 'https://media.istockphoto.com/id/957699448/es/vector/paso-de-hacer-el-ejercicio-de-escalador-de-monta%C3%B1a-de-mujer-sana.jpg?s=612x612&w=0&k=20&c=uf-MTtKT-UBKtxQm0-ytKH9dIiZ4dPASw6ZaFFFzY78=',
            video: 'https://www.youtube.com/embed/O7KxS8kQd3o',
        },
        {
            id: 13,
            name: 'Puentes de glúteos',
            description: 'Ejercicio para fortalecer los glúteos y la parte baja de la espalda.',
            detailedDescription:
                'Acuéstate en el suelo con las piernas dobladas y los pies apoyados. Levanta las caderas hacia el techo mientras contraes los glúteos y el abdomen.',
            image: 'https://media.foodspring.com/magazine/public/uploads/2020/11/DSC01505.jpg',
            video: 'https://www.youtube.com/embed/QvtrY1EYQK8',
        },
        {
            id: 14,
            name: 'Círculos con las piernas',
            description: 'Ejercicio para trabajar los glúteos y la parte interna de los muslos.',
            detailedDescription:
                'Acuéstate sobre tu espalda y levanta una pierna hacia el techo. Haz círculos pequeños con la pierna, luego repite con la otra pierna.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoXg9BbBEE4mkQSRB29nxkvIZRtHH_cXAH4w&s',
            video: 'https://www.youtube.com/embed/L8V2whtGVqM',
        },
        {
            id: 15,
            name: 'Ab twist en el suelo',
            description: 'Ejercicio para trabajar el abdomen y los oblicuos.',
            detailedDescription:
                'Siéntate con las piernas flexionadas y los pies elevados. Lleva el torso de un lado a otro, tocando el suelo con las manos.',
            image: 'https://media.istockphoto.com/id/1129638652/es/vector/mujer-haciendo-ejercicio-abdominal-con-la-posici%C3%B3n-de-giro-ruso-en-2-pasos-en-el-suelo.jpg?s=612x612&w=0&k=20&c=wwP7sOa1qNl4JYsi0KMtRs57vgRQDGywgf5ShTbk59U=',
            video: 'https://www.youtube.com/embed/q4Zld0rO4-A',
        },
        {
            id: 16,
            name: 'Sentadillas con salto',
            description: 'Ejercicio de bajo impacto para mejorar fuerza y coordinación.',
            detailedDescription:
                'Haz una sentadilla normal y, al subir, da un salto explosivo hacia arriba. Aterriza suavemente y repite el movimiento.',
            image: 'https://www.yomeentreno.com/wp-content/uploads/2019/12/Squat-Jump-480x369.jpg',
            video: 'https://www.youtube.com/embed/pc9pTQ6t_V8',
        },
        {
            id: 17,
            name: 'Rodillazos al pecho',
            description: 'Ejercicio cardiovascular para mejorar la resistencia.',
            detailedDescription:
                'De pie, levanta una rodilla hacia el pecho y alterna rápidamente con la otra pierna, manteniendo el ritmo alto.',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvBwaG4mI_YlEkYe4KVwaomP-Kn3y0TbgyJQ&s',
            video: 'https://www.youtube.com/embed/zsMN9muBdHU',
        },

        {
            id: 18,
            name: 'Tijeras',
            description: 'Ejercicio para mejorar flexibilidad y trabajar piernas.',
            detailedDescription:
                'Levanta las piernas en un ángulo de aproximadamente 30°. Tus pies están extendidos y tus rodillas ligeramente dobladas..',
            image: 'https://cdn.shopify.com/s/files/1/1321/0591/files/nucleotijeras_large.jpg?v=1597944539',
            video: 'https://www.youtube.com/embed/eBaHVjrk2yQ',
        },
        {
            id: 19,
            name: 'Elevación de piernas',
            description: 'Ejercicio para trabajar abdomen y caderas.',
            detailedDescription:
                'Acuéstate en el suelo y levanta las piernas hacia arriba, manteniéndolas rectas. Baja lentamente y repite.',
            image: 'https://s3assets.skimble.com/assets/4393/skimble-workout-trainer-exercise-straight-leg-raises-3_iphone.jpg',
            video: 'https://www.youtube.com/embed/0d8V3OZmZ7Y',
        }
    ];



    // Cargar ejercicios recomendados al iniciar
    useEffect(() => {
        setExercises(recommendedExercises);
    }, []);

    // Función para abrir el modal con los detalles del ejercicio
    const openExerciseDetails = (exercise) => {
        setSelectedExercise(exercise);
        setIsModalOpen(true);
    };

    // Función para cerrar el modal
    const closeExerciseDetails = () => {
        setIsModalOpen(false);
        setSelectedExercise(null);
    };
 
    // Función para guardar la actividad en Firebase
    const guardarActividad = async () => {
        if (!selectedExercise) {
            alert('No hay un ejercicio seleccionado.');
            return;
        }

        try {
            const actividad = {
                name: selectedExercise.name, // Nombre del ejercicio seleccionado
                duration: minutoos(time), // Tiempo transcurrido
                date: new Date().toISOString().split("T")[0], // Obtiene solo la fecha en formato "YYYY-MM-DD"
                userId: auth.currentUser.uid, // ID del usuario
            };

            const docRef = await addDoc(collection(db, 'activities'), actividad);
            console.log('Actividad guardada con ID: ', docRef.id);
            alert('Actividad guardada correctamente.');
        } catch (error) {
            console.error('Error al guardar actividad: ', error);
            alert('Hubo un error al guardar la actividad.');
        }
    };
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
         
            {/* Modal para mostrar detalles del ejercicio */}
            <div className="exercise-recommendations">
                <h2>Recomendaciones de Ejercicios</h2>
                <div className="exercise-list">
                    {exercises.map((exercise) => (
                        <div
                            key={exercise.id}
                            className="exercise-card"
                            onClick={() => openExerciseDetails(exercise)}
                        >
                            <img src={exercise.image} alt={exercise.name} className="exercise-image" />
                            <h3>{exercise.name}</h3>
                            <p>{exercise.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal para mostrar detalles del ejercicio */}
            {isModalOpen && selectedExercise && (
                <div className="modal-overlay" onClick={closeExerciseDetails}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeExerciseDetails}>
                            &times;
                        </button>
                        <h2>{selectedExercise.name}</h2>
                        <p>{selectedExercise.detailedDescription}</p>
                        {selectedExercise.video && (
                            <div className="video-container">
                                <iframe
                                    width="100%"
                                    height="315"
                                    src={selectedExercise.video}
                                    title="Video del ejercicio"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}
                        <p>{selectedExercise.descripcion}</p>

                        
                        {/* Cronómetro */}
                        <div className="timer">
                            <h3>Tiempo: {formatTime(time)}</h3>
                            <button onClick={toggleTimer}>
                                {isRunning ? 'Pausar' : 'Iniciar'}
                            </button>
                            <button onClick={resetTimer}>Reiniciar</button>
                            <button onClick={guardarActividad}>Guardar actividad</button>
                        </div>
                    </div>
                </div>
            )}

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

export default Ejercicios;