const { Router } = require('express');
const { database } = require('../firebase');


const router = Router();

router.get("/pedidos", (req, res) => {
    const { estado } = req.query;
    database.ref('Pedidos').once('value', (snapshot) => {
        const pedidos = snapshot.val();
        const pedidosFiltrados = Object.entries(pedidos || {})
            .map(([id, data]) => ({ id, ...data }))
            .filter(pedido => !estado || pedido.estado === estado);
        res.json(pedidosFiltrados);
    });
});

module.exports = router;
