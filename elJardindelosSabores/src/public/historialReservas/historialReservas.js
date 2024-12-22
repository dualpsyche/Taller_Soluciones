const socket = io();
let reservaActualId = null; // ID de la reserva que se está editando
// Bloquear fechas anteriores al día actual
const fechaInput = document.getElementById("fechaReserva");
const hoy = new Date(); // Obtener la fecha actual
const yyyy = hoy.getFullYear(); // Año actual
const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Mes actual (formato 2 dígitos)
const dd = String(hoy.getDate()).padStart(2, '0'); // Día actual (formato 2 dígitos)
fechaInput.min = `${yyyy}-${mm}-${dd}`; // Asignar fecha mínima
// Escuchar evento de nuevas reservas
socket.on('nuevaReserva', (reserva) => {
    agregarReservaATabla(reserva);
});

// Función para agregar una reserva a la tabla
function agregarReservaATabla(reserva) {
    const reservationList = document.getElementById('reservation-list');

    const row = document.createElement('tr');
    row.id = reserva.id; // Usar el ID como identificador único
    row.innerHTML = `
        <td>${reserva.id}</td>
        <td>${reserva.nombre}</td>
        <td>${reserva.correo}</td>
        <td>${reserva.telefono}</td>
        <td>${reserva.personas}</td>
        <td>${reserva.fecha}</td>
        <td>${reserva.hora}</td>
        <td>${reserva.estado}</td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="editarReserva('${reserva.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="eliminarReserva('${reserva.id}')">Eliminar</button>
        </td>
    `;
    reservationList.appendChild(row);
}

// Escuchar evento para renderizar todas las reservas
socket.on('cargarReservas', (reservas) => {
    renderizarReservas(reservas);
});

// Función para renderizar todas las reservas
function renderizarReservas(reservas) {
    const reservationList = document.getElementById('reservation-list');
    reservationList.innerHTML = ''; // Limpia la tabla antes de renderizar

    reservas.forEach((reserva) => {
        agregarReservaATabla(reserva);
    });
}


// Función para abrir el modal de edición y cargar datos de la reserva
function editarReserva(reservaId) {
    const row = document.getElementById(reservaId);
    if (!row) return;

    // Cargar datos en el modal
    reservaActualId = reservaId;
    document.getElementById('nombreReserva').value = row.children[1].innerText;
    document.getElementById('correoReserva').value = row.children[2].innerText;
    document.getElementById('telefonoReserva').value = row.children[3].innerText;
    document.getElementById('personasReserva').value = row.children[4].innerText;
    document.getElementById('fechaReserva').value = row.children[5].innerText;
    document.getElementById('horaReserva').value = row.children[6].innerText;
    document.getElementById('estadoReserva').value = row.children[7].innerText;

    const modalInstance = new bootstrap.Modal(document.getElementById('editarReservaModal'));
    modalInstance.show();
}

// Guardar cambios en la reserva
document.getElementById('editarReservaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reservaActualizada = {
        nombre: document.getElementById('nombreReserva').value,
        correo: document.getElementById('correoReserva').value,
        telefono: document.getElementById('telefonoReserva').value,
        personas: document.getElementById('personasReserva').value,
        fecha: document.getElementById('fechaReserva').value,
        hora: document.getElementById('horaReserva').value,
        estado: document.getElementById('estadoReserva').value,
    };

    try {
        await fetch(`/reservas/${reservaActualId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaActualizada),
        });

        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editarReservaModal'));
        modalInstance.hide();
        socket.emit('actualizarReserva', { id: reservaActualId, ...reservaActualizada });
        location.reload();
    } catch (error) {
        console.error('Error al actualizar la reserva:', error);
        alert('Hubo un error al actualizar la reserva.');
    }
});

// Función para eliminar una reserva
function eliminarReserva(reservaId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
        fetch(`/reservas/${reservaId}`, { method: 'DELETE' })
            .then(() => {
                document.getElementById(reservaId).remove(); // Eliminar fila de la tabla
                socket.emit('eliminarReserva', reservaId); // Notificar a otros clientes
            })
            .catch((error) => {
                console.error('Error al eliminar la reserva:', error);
            });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/reservas'); // Llama al endpoint del servidor
        const reservas = await response.json(); // Procesa la respuesta como JSON
        renderizarReservas(reservas); // Renderiza todas las reservas
    } catch (error) {
        console.error('Error al cargar las reservas:', error);
    }
});


// Escuchar eventos de actualización de reservas
// Escuchar eventos de actualización de reservas
socket.on('actualizarReserva', (reserva) => {
    const row = document.getElementById(reserva.id);
    if (row) {
        row.children[1].innerText = reserva.nombre;
        row.children[2].innerText = reserva.correo;
        row.children[3].innerText = reserva.telefono;
        row.children[4].innerText = reserva.personas;
        row.children[5].innerText = reserva.fecha;
        row.children[6].innerText = reserva.hora;
        row.children[7].innerText = reserva.estado;
    }
});

// Escuchar eventos de eliminación de reservas
socket.on('eliminarReserva', (reservaId) => {
    const row = document.getElementById(reservaId);
    if (row) {
        row.remove();
    }
});

socket.on('Nuevareserva', (reserva) => {
    agregarReservaATabla(reserva);
});


