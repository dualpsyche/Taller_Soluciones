const socket = io();
let pedidosCargados = []; // Almacena todos los pedidos cargados inicialmente


// Función para mostrar los pedidos en la tabla HTML
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();
});



function obtenerFiltroActual() {
    const filtroActivo = document.querySelector('button[data-filter].active');
    return filtroActivo ? filtroActivo.getAttribute('data-filter') : 'all';
}

function actualizarFilaPedido(pedido) {
    const filaExistente = document.getElementById(pedido.id);
    if (filaExistente) {
        filaExistente.innerHTML = generarHTMLFilaPedido(pedido);
    }
}

// Cargar pedidos y almacenarlos globalmente
async function cargarPedidos() {
    try {
        console.log('Iniciando carga de pedidos...'); // Diagnóstico
        const response = await fetch('/pedidos');
        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }
        pedidosCargados = await response.json(); // Almacena los pedidos cargados
        console.log('Pedidos cargados:', pedidosCargados); // Verifica el contenido de los datos
        renderizarPedidos(pedidosCargados); // Muestra todos los pedidos al inicio
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
    }
}

// Renderizar pedidos en la tabla
function renderizarPedidos(pedidos) {
    const tableBody = document.getElementById('order-list');
    tableBody.innerHTML = ''; // Limpia la tabla antes de renderizar

    if (!pedidos || pedidos.length === 0) {
        console.warn('No hay pedidos para renderizar.');
        return;
    }

    pedidos.forEach((pedido) => {
        console.log('Renderizando pedido:', pedido); // Diagnóstico de cada pedido
        mostrarPedido(pedido);
    });
}

// Función para filtrar pedidos por estado
// Función para filtrar pedidos por estado
function filterOrders(estado, button) {
    console.log('Estado seleccionado:', estado);

    // Resalta el botón seleccionado
    const botones = document.querySelectorAll('button[data-filter]');
    botones.forEach((btn) => btn.classList.remove('active'));
    if (button) button.classList.add('active');

    // Filtrar pedidos según el estado
    const pedidosFiltrados = (estado === 'all')
        ? pedidosCargados
        : pedidosCargados.filter((pedido) => pedido.estado && pedido.estado === estado);

    console.log('Pedidos filtrados:', pedidosFiltrados);
    renderizarPedidos(pedidosFiltrados);
}

async function cargarPedidos() {
    try {
        console.log('Iniciando carga de pedidos...'); // Diagnóstico
        const response = await fetch('/pedidos');
        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }
        pedidosCargados = await response.json(); // Almacena los pedidos cargados
        console.log('Pedidos cargados:', pedidosCargados); // Verifica el contenido de los datos
        renderizarPedidos(pedidosCargados); // Muestra todos los pedidos al inicio
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
    }
}

function actualizarTiempoEstimado(pedidoId, tiempoEstimado) {
    socket.emit('actualizarTiempoPedido', { id: pedidoId, tiempoEstimado });
}

// Escuchar eventos de cambios en el tiempo estimado

// Escuchar eventos de nuevos pedidos
socket.on('nuevoPedido', (pedido) => {
    mostrarPedido(pedido);
});

// Escuchar eventos de actualización de pedidos
function generarHTMLFilaPedido(pedido) {
    return `
        <td>${pedido.id}</td>
        <td>${pedido.mesa || 'Sin asignar'}</td>
        <td>${(pedido.items || []).map(item => `${item.cantidad} ${item.nombre}`).join(', ')}</td>
        <td>${pedido.comentarios || 'Sin comentarios'}</td>
        <td>$${pedido.total}</td>
        <td>${pedido.metodoPago}</td>
        <td>${pedido.estado || 'Pendiente'}</td>
        <td>
            <input type="number" class="form-control mb-2" placeholder="Tiempo estimado (min)"
                   onchange="actualizarTiempoEstimado('${pedido.id}', this.value)"
                   value="${pedido.tiempoEstimado || ''}">
        </td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="cambiarEstadoPedido('${pedido.id}', 'En Preparación')">Preparar</button>
            <button class="btn btn-success btn-sm" onclick="cambiarEstadoPedido('${pedido.id}', 'Completado')">Completar</button>
        </td>
    `;
}

function mostrarPedido(pedido) {
    const tableBody = document.getElementById('order-list');
    const filaExistente = document.getElementById(pedido.id);

    if (filaExistente) {
        actualizarFilaPedido(pedido); // Actualiza la fila existente
    } else {
        const fila = document.createElement('tr');
        fila.id = pedido.id;
        fila.innerHTML = generarHTMLFilaPedido(pedido);
        tableBody.appendChild(fila); // Agregar la fila a la tabla
    }
}

function actualizarTiempoEstimado(pedidoId, tiempoEstimado) {
    socket.emit('actualizarTiempoPedido', { id: pedidoId, tiempoEstimado });
}

// Escuchar eventos de eliminación de pedidos
socket.on('cambiarEstadoPedido', ({ id, estado }) => {
    const pedidoRef = database.ref(`Pedidos/${id}`);
    pedidoRef.update({ estado }, (error) => {
        if (error) {
            console.error('Error al actualizar el estado del pedido:', error);
        } else {
            console.log('Estado del pedido actualizado:', { id, estado });
            io.emit('actualizarPedido', { id, estado }); // Notificar a todos los clientes
        }
    });
});

socket.on('nuevoPedido', (pedido) => {
    console.log('Nuevo pedido recibido:', pedido);
    pedidosCargados.push(pedido); // Agregar el pedido al array global
    const filtroActual = obtenerFiltroActual(); // Verifica el filtro activo
    if (filtroActual === 'all' || pedido.estado === filtroActual) {
        mostrarPedido(pedido); // Mostrar solo si el filtro lo permite
    }
});

socket.on('actualizarPedido', (pedidoActualizado) => {
    console.log('Pedido actualizado recibido:', pedidoActualizado);
    const index = pedidosCargados.findIndex((pedido) => pedido.id === pedidoActualizado.id);

    if (index !== -1) {
        // Actualizar el pedido en la lista global
        pedidosCargados[index] = pedidoActualizado;

        // Re-renderizar la tabla según el filtro actual
        const filtroActual = obtenerFiltroActual();
        filterOrders(filtroActual);
    } else {
        console.warn(`No se encontró el pedido con ID: ${pedidoActualizado.id}`);
    }
});

socket.on('actualizarTiempoPedido', ({ id, tiempoEstimado }) => {
    const pedidoRef = database.ref(`Pedidos/${id}`);
    pedidoRef.update({ tiempoEstimado }, (error) => {
        if (error) {
            console.error('Error al actualizar el tiempo estimado:', error);
        } else {
            const pedido = { id, tiempoEstimado };
            io.emit('actualizarPedido', pedido); // Envía a todos los clientes
        }
    });
});


function asignarTiempoEstimado(pedidoId, minutos) {
    socket.emit('asignarTiempo', { id: pedidoId, tiempo: minutos });
}

// Función para cambiar el estado del pedido
function cambiarEstadoPedido(pedidoId, nuevoEstado) {
    socket.emit('cambiarEstadoPedido', { id: pedidoId, estado: nuevoEstado });

    // Actualizar estado localmente
    const pedidoIndex = pedidosCargados.findIndex((pedido) => pedido.id === pedidoId);
    if (pedidoIndex !== -1) {
        pedidosCargados[pedidoIndex].estado = nuevoEstado;
    }

    // Reaplicar el filtro actual
    const filtroActual = document.querySelector('button[data-filter].active')?.getAttribute('data-filter') || 'all';
    filterOrders(filtroActual);
}

