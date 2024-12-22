const express = require('express');
const { database } = require('../firebase');
const router = express.Router();

// Crear una nueva reserva
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
        const ref = database.ref('Reservas').push();
        await ref.set(nuevaReserva);

        // Enviar respuesta con ID generado por Firebase
        res.status(201).json({ id: ref.key, ...nuevaReserva });
    } catch (error) {
        console.error('Error al crear la reserva:', error);
        res.status(500).send('Error al crear la reserva');
    }
});

// Actualizar una reserva (e.g., confirmar o cancelar)
router.patch('/reservas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const actualizacion = req.body;

        // Validar que `id` existe en Firebase
        const reservaRef = database.ref(`Reservas/${id}`);
        const snapshot = await reservaRef.once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Actualizar la reserva
        await reservaRef.update(actualizacion);

        res.status(200).send('Reserva actualizada correctamente');
    } catch (error) {
        console.error('Error al actualizar la reserva:', error);
        res.status(500).send('Error al actualizar la reserva');
    }
});

module.exports = router;
