const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const morgan = require('morgan');
const cors = require('cors');
const { engine } = require('express-handlebars');
const path = require('path');
const { database } = require('./firebase');
const authRoutes = require("./routes/auth");
const app = express();
const server = http.createServer(app);
const bcrypt = require('bcrypt');
const io = socketIo(server);
const reservasRouter = require('./routes/reservas');
const nodemailer = require('nodemailer');

app.post("/auth/validate", async (req, res) => {
    const token = req.body.token;

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        res.status(200).send({ success: true, uid: decodedToken.uid });
    } catch (error) {
        console.error("Error al validar token:", error);
        res.status(401).send({ success: false, error: "Token inválido" });
    }
});


// Configura el transporter para enviar correos
const transporter = nodemailer.createTransport({
    service: 'gmail', // O el servicio que uses (Outlook, etc.)
    auth: {
        user: 'eljardindelossabores7', // Reemplaza con tu correo
        pass: 'EljardindelosSabores77@!!!!' // Contraseña o App Password
    }
});

// Middleware
app.use('/reservas', reservasRouter);
app.use(cors());
app.use(express.json()); // Middleware para JSON debe ir antes de las rutas
app.use(express.urlencoded({ extended: true })); // Middleware para URL-encoded
app.use(morgan('dev'));

// Configuración de vistas y motor de plantillas
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs',
}));
app.set('view engine', '.hbs');

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Escucha de nuevos pedidos en Firebase
database.ref('Pedidos').on('child_added', (snapshot) => {
    const pedido = { id: snapshot.key, ...snapshot.val() };
    io.emit('nuevoPedido', pedido); // Emitir el pedido completo
});

database.ref('Pedidos').on('child_changed', (snapshot) => {
    const pedido = { id: snapshot.key, ...snapshot.val() };
    io.emit('actualizarPedido', pedido); // Notificar a los clientes
});


io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('actualizarTiempoPedido', ({ id, tiempoEstimado }) => {
        const pedidoRef = database.ref(`Pedidos/${id}`);
        pedidoRef.update({ tiempoEstimado }, (error) => {
            if (error) {
                console.error('Error al actualizar el tiempo estimado:', error);
            } else {
                console.log('Tiempo estimado actualizado:', { id, tiempoEstimado });
                io.emit('actualizarPedido', { id, tiempoEstimado }); // Notifica a los clientes
            }
        });
    });
});
io.on('actualizarPedido', (pedido) => {
    if (pedido.id === pedidoActual?.id) {
        document.getElementById('pedidoEstado').textContent = pedido.estado || 'Pendiente';
        document.getElementById('pedidoTiempo').textContent = pedido.tiempo ? `${pedido.tiempo} minutos` : 'N/A';
    }
});

io.on('nuevoPedido', (pedido) => {
    // Opcional: Si el cliente necesita ver inmediatamente el nuevo pedido
    if (pedido.id === pedidoActual?.id) {
        document.getElementById('pedidoEstado').textContent = pedido.estado || 'Pendiente';
        document.getElementById('pedidoTiempo').textContent = pedido.tiempo ? `${pedido.tiempo} minutos` : 'N/A';
    }
});

// Escucha de nuevas reservas en Firebase

// Escucha las reservas en Firebase y las envía al cliente
(async () => {
    const username = 'admin'; // Nombre de usuario
    const password = 'password123'; // Contraseña del administrador
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminRef = database.ref('usuarios').push();
    const adminUser = {
        id: adminRef.key,
        username,
        password: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString(),
    };

    await adminRef.set(adminUser);
    console.log('Administrador creado:', adminUser);
})();

// Escucha de nuevas reservas en Firebase
database.ref('Reservas').on('child_added', (snapshot) => {
    const nuevaReserva = { id: snapshot.key, ...snapshot.val() };
    io.emit('nuevaReserva', nuevaReserva); // Emitir la nueva reserva
});

// Escucha de cambios en reservas
database.ref('Reservas').on('child_changed', (snapshot) => {
    const reservaActualizada = { id: snapshot.key, ...snapshot.val() };
    io.emit('actualizarReserva', reservaActualizada); // Emitir la reserva actualizada
});

database.ref('Reservas').on('value', (snapshot) => {
    const reservas = [];
    snapshot.forEach((childSnapshot) => {
        const reserva = { id: childSnapshot.key, ...childSnapshot.val() };
        reservas.push(reserva);
    });

    // Emitir todas las reservas
    io.emit('cargarReservas', reservas);
});

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('registrarMesa', (mesaId) => {
        socket.join(`mesa-${mesaId}`);
        console.log(`Cliente registrado en la mesa ${mesaId}`);
    });

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
        const pedidoId = obtenerParametroPedidoId();
        if (pedido.id === pedidoId) { // Verifica que el pedido coincida con el ID en la URL
            pedidoActual = pedido;
            actualizarModalEstadoPedido();
        }
    });
    
    socket.on('actualizarPedido', (pedido) => {
        const pedidoId = obtenerPedidoId(); // Obtener el ID del pedido actual
        if (pedido.id === pedidoId) { // Verificar si el pedido coincide con el actual
            pedidoActual = { ...pedidoActual, ...pedido }; // Actualizar datos del pedido
            actualizarModalEstadoPedido(); // Refrescar el modal
        }
    });

    socket.on('cambiarEstadoReserva', ({ id, estado }) => {
        database.ref(`Reservas/${id}`).update({ estado }, (error) => {
            if (!error) {
                io.emit('actualizarReserva', { id, estado }); // Notifica a todos los clientes conectados
            }
        });
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

    socket.on('actualizarReserva', (reserva) => {
        const reservaRef = database.ref(`Reservas/${reserva.id}`);
        reservaRef.update(reserva, (error) => {
            if (!error) {
                io.emit('actualizarReserva', reserva); // Envía el evento al cliente
            } else {
                console.error('Error al actualizar la reserva:', error);
            }
        });
    });

    socket.on('eliminarReserva', (reservaId) => {
        const reservaRef = database.ref(`Reservas/${reservaId}`);
        reservaRef.remove((error) => {
            if (!error) {
                io.emit('eliminarReserva', reservaId); // Envía el evento al cliente
            } else {
                console.error(error);
            }
        });
    });
    
    
});

// Importación de rutas, pasando io como argumento
const indexRouter = require('./routes/index')(io);
app.use(indexRouter); // Registro de las rutas después del middleware de JSON

// Configuración de puertos y servidor
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

module.exports = app;
