document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const horaSelect = document.getElementById("hora");

  if (fechaInput && horaSelect) {
      const horasInicio = 12; // 12:00 PM
      const horasFin = 1; // 1:00 AM (al día siguiente)

      const generarOpciones = () => {
          horaSelect.innerHTML = ''; // Limpia las opciones existentes
          for (let hora = horasInicio; hora <= 23; hora++) {
              const formatoHora = hora > 12 ? hora - 12 : hora; // Conversión a formato 12 horas
              const opcion = document.createElement("option");
              opcion.value = `${hora}:00`;
              opcion.textContent = `${formatoHora}:00 PM`;
              horaSelect.appendChild(opcion);
          }

          const opcionAM = document.createElement("option");
          opcionAM.value = `0:00`;
          opcionAM.textContent = `1:00 AM`;
          horaSelect.appendChild(opcionAM);
      };

      const actualizarHorasDisponibles = async (fecha) => {
          try {
              const response = await fetch(`/reservas/disponibilidad?fecha=${fecha}`);
              const data = await response.json();

              if (data.horasNoDisponibles) {
                  const horasNoDisponibles = new Set(data.horasNoDisponibles);

                  Array.from(horaSelect.options).forEach((opcion) => {
                      if (horasNoDisponibles.has(opcion.value)) {
                          opcion.disabled = true; // Deshabilita las horas no disponibles
                      }
                  });
              }
          } catch (error) {
              console.error('Error al actualizar las horas disponibles:', error);
          }
      };

      fechaInput.addEventListener("change", () => {
          const fechaSeleccionada = fechaInput.value;

          if (fechaSeleccionada) {
              generarOpciones(); // Genera todas las opciones nuevamente
              actualizarHorasDisponibles(fechaSeleccionada); // Actualiza las horas disponibles
          }
      });

      // Bloquear fechas anteriores al día actual
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, '0');
      const dd = String(hoy.getDate()).padStart(2, '0');
      fechaInput.min = `${yyyy}-${mm}-${dd}`;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const horaSelect = document.getElementById("hora");
  if (horaSelect) {
    const horasInicio = 12; // 12:00 PM
    const horasFin = 1; // 1:00 AM (al día siguiente)

    // Generar opciones de 12 PM a 11 PM
    for (let hora = horasInicio; hora <= 23; hora++) {
      const formatoHora = hora > 12 ? hora - 12 : hora; // Conversión a formato 12 horas
      const opcion = document.createElement("option"); // Variable bien definida aquí
      opcion.value = `${hora}:00`;
      opcion.textContent = `${formatoHora}:00 PM`;
      horaSelect.appendChild(opcion);
    }

    // Generar la opción de la 1:00 AM
    const opcionAM = document.createElement("option");
    opcionAM.value = `0:00`;
    opcionAM.textContent = `1:00 AM`;
    horaSelect.appendChild(opcionAM);

    // Bloquear fechas anteriores al día actual
    const fechaInput = document.getElementById("fecha");
    const hoy = new Date(); // Obtener la fecha actual
    const yyyy = hoy.getFullYear(); // Año actual
    const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Mes actual (formato 2 dígitos)
    const dd = String(hoy.getDate()).padStart(2, '0'); // Día actual (formato 2 dígitos)
    fechaInput.min = `${yyyy}-${mm}-${dd}`; // Asignar fecha mínima
  }
});

// Evento de submit para el formulario de reservas
document.getElementById('reservation-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const datos = Object.fromEntries(formData.entries());

  try {
    const container = document.querySelector('.reservation-container');
    container.querySelector('.reservation-form').remove(); // Borra el formulario
    const mensaje = document.createElement('p');
    mensaje.textContent = '¡Reserva confirmada con éxito!';
    mensaje.style.marginTop = '50px'; // Para mantener la altura inicial
    container.appendChild(mensaje);

    const response = await fetch('/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      alert('Error al confirmar la reserva');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

