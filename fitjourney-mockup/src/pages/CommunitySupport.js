import React, { useState } from 'react';
import './CommunitySupport.css'; // Archivo CSS para estilos

function CommunitySupport() {
 
  // Función para agregar un alimento

  

 
  return (
    <div className="food-register">
      <h2>CommunitySupport de copmid</h2>

      {/* Formulario de Registro */}
      <form  className="food-form">
        <input
          type="text"
          placeholder="Nombre del alimento"
         
        />
        <input
          type="text"
          placeholder="Cantidad (ej: 100g, 1 taza)"
        
        />
        <input
          type="number"
          placeholder="Calorías (opcional)"
     
        />
        <button type="submit">Agregar</button>
      </form>

   

      {/* Resumen de Calorías */}
      <div className="calories-summary">
     
      </div>
   
    </div>
  );
}

export default CommunitySupport;