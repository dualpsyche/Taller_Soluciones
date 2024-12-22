// src/routes/index.js
const { Router } = require('express');
const router = Router();
const bcrypt = require('bcrypt');
const { database } = require('../firebase');
const jwt = require('jsonwebtoken')
const { verificarToken, verificarRolAdmin } = require('../middleware/authMiddleware');
const productosRef = database.ref("Productos"); // Referencia a la colección de productos

function generarReporte(pedidos) {
    const reporte = {
        ventasPorDia: {},
        productosVendidos: {},
        ventasPorMesa: {},
        estadosPedidos: {},
        metodosPago: {},
    };

    pedidos.forEach((pedido) => {
        try {
            // Ventas por día
            if (pedido.fecha && pedido.total) {
                reporte.ventasPorDia[pedido.fecha] = (reporte.ventasPorDia[pedido.fecha] || 0) + pedido.total;
            }

            // Productos más vendidos
            if (pedido.items && Array.isArray(pedido.items)) {
                pedido.items.forEach((item) => {
                    if (item.nombre && item.cantidad) {
                        reporte.productosVendidos[item.nombre] = (reporte.productosVendidos[item.nombre] || 0) + item.cantidad;
                    }
                });
            }

            // Ventas por mesa
            if (pedido.mesa && pedido.total) {
                reporte.ventasPorMesa[pedido.mesa] = (reporte.ventasPorMesa[pedido.mesa] || 0) + pedido.total;
            }

            // Estados de pedidos
            if (pedido.estado) {
                reporte.estadosPedidos[pedido.estado] = (reporte.estadosPedidos[pedido.estado] || 0) + 1;
            }

            // Métodos de pago
            if (pedido.metodoPago) {
                reporte.metodosPago[pedido.metodoPago] = (reporte.metodosPago[pedido.metodoPago] || 0) + 1;
            }
        } catch (error) {
            console.warn("Error procesando pedido:", pedido, error);
        }
    });

    return reporte;
}


module.exports = (io) => {
    router.get('/', (req, res) => {
        const mesa = req.query.mesa; // Captura el ID de la mesa desde la URL
        res.render('index', { mesa }); // Pasa el ID de la mesa a la vista
    });

    router.get('/ps', (req, res) => {
        res.render('ps');
    });

    router.get('/admin', (req, res) => {
        res.render('admin');
    });

    router.get('/login', (req, res) => {
        res.render('inicioSesion');
    });

    router.get('/registrar', (req, res) => {
        res.render('registrar');
    });

    router.get('/reserva', (req, res) => {
        res.render('reserva');
    });

    router.get('/panelReservas', (req, res) => {
        res.render('panelReservas');
    });

    router.get('/historialReservas', (req, res) => {
        res.render('historialReservas');
    });
    
    router.get('/reportes', (req, res) => {
        res.render('reportes');
    });

    router.get('/inventario', (req, res) => {
        res.render('inventario');
    });

    router.get('/admin', verificarToken, verificarRolAdmin, (req, res) => {
        res.render('admin'); // Renderiza la vista del panel administrativo
    });

    router.get("/productos", async (req, res) => {
        try {
            const snapshot = await productosRef.once("value");
            const productos = snapshot.val();
            res.json(productos);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            res.status(500).json({ message: "Error al obtener productos" });
        }
    });

    router.post('/registrar', async (req, res) => {
        const { username, password, role } = req.body;
    
        if (!username || !password) {
            return res.status(400).json({ error: 'Nombre de usuario y contraseña son obligatorios' });
        }
    
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRef = database.ref('usuarios').push();
    
            const newUser = {
                id: userRef.key,
                username,
                password: hashedPassword,
                role: role || 'admin', // Por defecto, crea un admin
                created_at: new Date().toISOString(),
            };
    
            await userRef.set(newUser);
            res.status(201).json({ message: 'Usuario creado exitosamente', user: newUser });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    });
    
    // Ruta para iniciar sesión
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Nombre de usuario y contraseña son obligatorios' });
        }
    
        try {
            const snapshot = await database.ref('usuarios')
                .orderByChild('username')
                .equalTo(username)
                .once('value');
    
            if (!snapshot.exists()) {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }
    
            const userData = Object.values(snapshot.val())[0];
            const isPasswordValid = await bcrypt.compare(password, userData.password);
    
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }
    
            const token = jwt.sign({ id: userData.id, role: userData.role }, 'secreto', { expiresIn: '1h' });
    
            res.status(200).json({ message: 'Inicio de sesión exitoso', token });
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            res.status(500).json({ error: 'Error al iniciar sesión' });
        }
    });
    


    router.post("/actualizarPedido", (req, res) => {
        const { id, estado, tiempo } = req.body;
        const pedidoRef = database.ref(`Pedidos/${id}`);
    
        pedidoRef.update({ estado, tiempo }, (error) => {
            if (error) return res.status(500).json({ message: "Error al actualizar el pedido" });
            res.json({ message: "Pedido actualizado" });
            socket.emit('actualizarPedido', { id, estado, tiempo }); // Notifica a todos los clientes
        });
    });

    router.post("/pedido", (req, res) => {
        console.log("Body recibido en el servidor:", req.body);
        const nuevoPedido = req.body;
    
        if (!nuevoPedido.items || !nuevoPedido.total || !nuevoPedido.metodoPago) {
            console.error("Datos del pedido incompletos:", nuevoPedido);
            return res.status(400).json({ message: "Datos del pedido incompletos" });
        }
    
        const pedidoRef = database.ref('Pedidos').push(); // Generar un nuevo pedido en Firebase
        const pedidoId = pedidoRef.key; // Obtener el ObjectID generado por Firebase
    
        nuevoPedido.id = pedidoId; // Asignar el ID generado al pedido
        

        pedidoRef.set(nuevoPedido, (error) => {
            if (error) {
                console.error("Error al enviar el pedido:", error);
                return res.status(500).json({ message: "Error al enviar el pedido" });
            }
    
            console.log("Pedido ingresado con éxito:", nuevoPedido);
            res.json({ message: "Pedido enviado con éxito", pedido: nuevoPedido }); // Devolver el ID al cliente
        });
    });
    
    router.get('/pedidos', async (req, res) => {
        try {
            const pedidosSnapshot = await database.ref('Pedidos').once('value');
            const pedidos = [];
            pedidosSnapshot.forEach((pedidoSnap) => {
                const pedido = pedidoSnap.val();
                pedidos.push({
                    id: pedidoSnap.key,
                    mesa: pedido.mesa || 'Sin asignar',
                    estado: pedido.estado || 'Pendiente',
                    items: pedido.items || [],
                    comentarios: pedido.comentarios || '',
                    total: pedido.total || 0,
                    metodoPago: pedido.metodoPago || 'No especificado',
                    tiempoEstimado: pedido.tiempoEstimado || 0
                });
            });
            console.log('Pedidos enviados desde el servidor:', pedidos); // Verifica los datos en el servidor
            res.json(pedidos);
        } catch (error) {
            console.error('Error al obtener los pedidos:', error);
            res.status(500).json({ message: 'Error al obtener los pedidos' });
        }
    });
    
    router.post('/Nuevareserva', async (req, res) => {
        const nuevaReserva = req.body;
    
        try {
            const reservaRef = database.ref('Reservas').push(); // Crea un nuevo nodo en Firebase
            const id = reservaRef.key; // Obtiene el ID único generado
    
            nuevaReserva.id = id; // Asigna el ID generado
            await reservaRef.set(nuevaReserva);
    
            io.emit('nuevaReserva', nuevaReserva); // Notifica a todos los clientes conectados
            res.status(201).json(nuevaReserva);
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            res.status(500).send('Error al crear la reserva');
        }
    });
    
    
    router.get('/pedido/:id', async (req, res) => {
        const { id } = req.params;
    
        try {
            const snapshot = await database.ref(`Pedidos/${id}`).once('value');
            if (!snapshot.exists()) {
                return res.status(404).json({ message: 'Pedido no encontrado' });
            }
    
            res.json(snapshot.val());
        } catch (error) {
            console.error('Error al obtener el pedido:', error);
            res.status(500).json({ message: 'Error al obtener el pedido' });
        }
    });

    router.get("/test-firebase", async (req, res) => {
        try {
            const snapshot = await database.ref("Pedidos").once("value");
            console.log("Conexión a Firebase exitosa:", snapshot.exists());
            res.json({ message: "Conexión a Firebase exitosa", data: snapshot.val() });
        } catch (error) {
            console.error("Error en la conexión a Firebase:", error);
            res.status(500).json({ message: "Error en la conexión a Firebase" });
        }
    });

    // router.get('/dashboard', verifyFirebaseToken, (req, res) => {
    //     if (!req.user) {
    //         return res.status(401).json({ message: "Usuario no autenticado" });
    //     }
    //     res.render('dashboard', { user: req.user });
    // });


    router.get('/ps', async (req, res) => {
        try {
            const snapshot = await database.ref('Pedidos').once('value');
            const pedidos = [];
            snapshot.forEach((childSnapshot) => {
                const pedido = { id: childSnapshot.key, ...childSnapshot.val() };
                pedidos.push(pedido);
            });
            res.render('panelRestaurante', { pedidos }); // Renderizar la vista con los datos
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            res.status(500).send('Error al cargar pedidos');
        }
    });

    router.get('/reservas/disponibilidad', async (req, res) => {
        const { fecha } = req.query;
    
        if (!fecha) {
            return res.status(400).json({ error: 'La fecha es requerida' });
        }
    
        try {
            const snapshot = await database.ref('Reservas').orderByChild('fecha').equalTo(fecha).once('value');
            const horasNoDisponibles = [];
    
            snapshot.forEach((childSnapshot) => {
                const reserva = childSnapshot.val();
                horasNoDisponibles.push(reserva.hora);
            });
    
            res.json({ horasNoDisponibles });
        } catch (error) {
            console.error('Error al obtener la disponibilidad:', error);
            res.status(500).send('Error al obtener la disponibilidad');
        }
    });

    // Endpoint para obtener el historial de reservas
    router.get('/historialReservas', async (req, res) => {
        try {
            const snapshot = await database.ref('Reservas').once('value');
            const reservas = [];

            snapshot.forEach((childSnapshot) => {
                const reserva = childSnapshot.val();
                reservas.push({
                    id: childSnapshot.key,
                    ...reserva,
                });
            });

            res.render('historialReservas', { reservas }); // Renderiza la vista con las reservas
        } catch (error) {
            console.error('Error al cargar las reservas:', error);
            res.status(500).send('Error al cargar las reservas');
        }
    });

    // Ruta para actualizar una reserva
    router.put('/reservas/:id', async (req, res) => {
        const { id } = req.params;
        const actualizacion = req.body;
    
        try {
            const reservaRef = database.ref(`Reservas/${id}`);
            await reservaRef.update(actualizacion);
    
            const reservaActualizada = { id, ...actualizacion };
            io.emit('actualizarReserva', reservaActualizada); // Notifica a todos los clientes conectados
            res.json({ message: 'Reserva actualizada', reserva: reservaActualizada });
        } catch (error) {
            console.error('Error al actualizar la reserva:', error);
            res.status(500).send('Error al actualizar la reserva');
        }
    });
    
    router.get('/reservas', async (req, res) => {
        try {
            const snapshot = await database.ref('Reservas').once('value');
            const reservas = [];
    
            snapshot.forEach((childSnapshot) => {
                const reserva = { id: childSnapshot.key, ...childSnapshot.val() };
                reservas.push(reserva);
            });
    
            res.json(reservas); // Devuelve todas las reservas como JSON
        } catch (error) {
            console.error('Error al obtener las reservas:', error);
            res.status(500).send('Error al obtener las reservas');
        }
    });
    
    

    // Ruta para eliminar una reserva
    router.delete('/reservas/:id', async (req, res) => {
        const { id } = req.params;
    
        try {
            const reservaRef = database.ref(`Reservas/${id}`);
            await reservaRef.remove();
    
            io.emit('eliminarReserva', id); // Notifica a todos los clientes
            res.json({ message: 'Reserva eliminada', id });
        } catch (error) {
            console.error('Error al eliminar la reserva:', error);
            res.status(500).send('Error al eliminar la reserva');
        }
    });

    router.post('/reservas', async (req, res) => {
        try {
            const { nombre, correo, telefono, personas, fecha, hora } = req.body;
    
            // Verificar que todos los campos requeridos estén presentes
            if (!nombre || !correo || !telefono || !personas || !fecha || !hora) {
                return res.status(400).json({ error: 'Todos los campos son obligatorios' });
            }
    
            const nuevaReserva = {
                nombre,
                correo,
                telefono,
                personas,
                fecha,
                hora,
                estado: 'Confirmada', // Estado por defecto
                fechaCreacion: new Date().toISOString() // Fecha de creación automática
            };
    
            // Guardar la reserva en Firebase
            const reservaRef = database.ref('Reservas').push();
    
            // Obtener el ObjectID generado por Firebase
            const reservaId = reservaRef.key;
    
            // Añadir el ID generado a la nueva reserva
            nuevaReserva.id = reservaId;
    
            // Guardar la reserva en la referencia generada
            await reservaRef.set(nuevaReserva);
    
            // Emitir la nueva reserva a todos los clientes conectados
            io.emit('nuevaReserva', nuevaReserva);
    
            // Enviar respuesta con ID generado por Firebase
            console.log('Reserva creada con éxito:', nuevaReserva);
            res.status(201).json({ message: 'Reserva creada con éxito', reserva: nuevaReserva });
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            res.status(500).send('Error al crear la reserva');
        }
    });
    
    router.get('/reportes/data', async (req, res) => {
        try {
            const { inicio, fin, estado, metodoPago } = req.query;
            console.log("Parámetros recibidos:", { inicio, fin, estado, metodoPago });
    
            const snapshot = await database.ref('Pedidos').once('value');
            const pedidos = [];
    
            snapshot.forEach((childSnapshot) => {
                const pedido = childSnapshot.val();
    
                if (!pedido.fecha || !pedido.estado || !pedido.metodoPago) {
                    console.warn("Pedido con datos incompletos ignorado:", pedido);
                    return;
                }
    
                const fechaPedido = pedido.fecha;
    
                if (
                    (!inicio || fechaPedido >= inicio) &&
                    (!fin || fechaPedido <= fin) &&
                    (!estado || pedido.estado === estado) &&
                    (!metodoPago || pedido.metodoPago === metodoPago)
                ) {
                    pedidos.push(pedido);
                }
            });
    
            if (pedidos.length === 0) {
                console.warn("No se encontraron pedidos con los filtros aplicados.");
                return res.json({ message: "No se encontraron pedidos con los filtros aplicados." });
            }
    
            const reporte = generarReporte(pedidos); // Asegúrate de que esté disponible
            console.log("Reporte generado correctamente:", reporte);
    
            res.json(reporte);
        } catch (error) {
            console.error("Error interno al generar el reporte:", error);
            res.status(500).json({ error: "Error al generar reporte", detalles: error.message });
        }
    });
    
    

    router.get('/revisar-datos', async (req, res) => {
        try {
            const snapshot = await database.ref('Pedidos').once('value');
            const pedidos = [];
    
            snapshot.forEach((childSnapshot) => {
                const pedido = childSnapshot.val();
                pedidos.push(pedido);
            });
    
            console.log("Datos completos de Firebase:", pedidos);
            res.json(pedidos);
        } catch (error) {
            console.error("Error al revisar los datos:", error);
            res.status(500).json({ error: "Error al revisar los datos" });
        }
    });
    
    
    
    
    router.get('/reportes/estadisticas', async (req, res) => {
        try {
            const snapshot = await database.ref('Pedidos').once('value');
            const estadisticas = {
                totalVentas: 0,
                pedidosPorEstado: { completado: 0, pendiente: 0 },
                ventasPorDia: {},
                ventasPorMesa: {}
            };

            snapshot.forEach((childSnapshot) => {
                const pedido = childSnapshot.val();
                estadisticas.totalVentas += pedido.total || 0;

                if (pedido.estado) {
                    estadisticas.pedidosPorEstado[pedido.estado] =
                        (estadisticas.pedidosPorEstado[pedido.estado] || 0) + 1;
                }

                if (pedido.fecha) {
                    estadisticas.ventasPorDia[pedido.fecha] =
                        (estadisticas.ventasPorDia[pedido.fecha] || 0) + pedido.total;
                }

                if (pedido.mesa) {
                    estadisticas.ventasPorMesa[pedido.mesa] =
                        (estadisticas.ventasPorMesa[pedido.mesa] || 0) + pedido.total;
                }
            });

            res.json(estadisticas);
        } catch (error) {
            console.error('Error al generar estadísticas:', error);
            res.status(500).json({ error: 'Error al generar estadísticas' });
        }
    });
module.exports = (io) => router; 
    return router;
};
