let chartTendencia = null;
let chartEstados = null;
let chartDiaSemana = null;
let chartMetodosPago = null;
let chartReservasHora = null;
let charts = {};
let graficos = []; // Almacenará instancias de gráficos

document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('filtrarReportes');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const estado = document.getElementById('estadoFiltro').value;
            const metodoPago = document.getElementById('metodoPagoFiltro').value;

            if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
                alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                return;
            }

            fetch(`/reportes/data?inicio=${fechaInicio}&fin=${fechaFin}&estado=${estado}&metodoPago=${metodoPago}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error('Error en el backend:', data.error);
                        alert('Error al generar el reporte.');
                        return;
                    }
                    generarGraficos(data);
                })
                .catch(error => console.error('Error al filtrar reportes:', error));
        });
    }
});

function actualizarKPIs(reporte) {
    const totalVentas = Object.values(reporte.ventasPorDia || {}).reduce((acc, valor) => acc + valor, 0);
    const pedidosCompletados = reporte.estadosPedidos?.Completado || 0;
    const totalPedidos = Object.values(reporte.estadosPedidos || {}).reduce((acc, valor) => acc + valor, 0);
    const promedioPorPedido = totalPedidos > 0 ? (totalVentas / totalPedidos).toFixed(2) : 0;
    const pedidosPendientes = reporte.estadosPedidos?.Pendiente || 0;

    // Actualizar en la interfaz
    document.getElementById('ventasTotales').textContent = `$${totalVentas.toFixed(2)}`;
    document.getElementById('pedidosCompletados').textContent = pedidosCompletados;
    document.getElementById('promedioPorPedido').textContent = `$${promedioPorPedido}`;
    document.getElementById('pedidosPendientes').textContent = pedidosPendientes;
}




document.addEventListener('DOMContentLoaded', () => {
    // Aquí todo tu código
    generarGraficos([]);
});


function generarGraficos(reporte) {
    destruirGraficos(); // Limpiar gráficos anteriores.

    // Actualizar los KPIs
    actualizarKPIs(reporte);

    // Validar y graficar solo si los datos existen
    if (reporte.ventasPorDia && Object.keys(reporte.ventasPorDia).length > 0) {
        generarGraficoLinea('tendenciaVentas', reporte.ventasPorDia, 'Ventas por Día');
    }
    if (reporte.productosVendidos && Object.keys(reporte.productosVendidos).length > 0) {
        generarGraficoBarras('productosMasVendidos', reporte.productosVendidos, 'Productos Más Vendidos');
    }
    if (reporte.ventasPorMesa && Object.keys(reporte.ventasPorMesa).length > 0) {
        generarGraficoBarras('ventasPorMesa', reporte.ventasPorMesa, 'Ventas por Mesa');
    }
    if (reporte.estadosPedidos && Object.keys(reporte.estadosPedidos).length > 0) {
        generarGraficoTorta('estadoPedidos', reporte.estadosPedidos, 'Estados de Pedidos');
    }
    if (reporte.metodosPago && Object.keys(reporte.metodosPago).length > 0) {
        generarGraficoDona('metodosDePago', reporte.metodosPago, 'Métodos de Pago');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('filtrarReportes');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const estado = document.getElementById('estadoFiltro').value;
            const metodoPago = document.getElementById('metodoPagoFiltro').value;

            if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
                alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
                return;
            }

            fetch(`/reportes/data?inicio=${fechaInicio}&fin=${fechaFin}&estado=${estado}&metodoPago=${metodoPago}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error('Error en el backend:', data.error);
                        alert('Error al generar el reporte. Intenta nuevamente.');
                        return;
                    }
                    generarGraficos(data);
                })
                .catch((error) => console.error('Error al filtrar reportes:', error));
        });
    }
});


function destruirGraficos() {
    graficos.forEach((grafico) => grafico.destroy());
    graficos = [];
}

// Función para generar un gráfico de líneas
function generarGraficoLinea(idCanvas, data, titulo) {
    const ctx = document.getElementById(idCanvas).getContext('2d');
    const labels = Object.keys(data);
    const valores = Object.values(data);

    const grafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: valores,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    graficos.push(grafico);
}

// Función para generar un gráfico de barras
function generarGraficoBarras(idCanvas, data, titulo) {
    const ctx = document.getElementById(idCanvas).getContext('2d');
    const labels = Object.keys(data);
    const valores = Object.values(data);

    const grafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: valores,
                backgroundColor: '#17a2b8'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    graficos.push(grafico);
}

// Función para generar un gráfico de torta (pie)
function generarGraficoTorta(idCanvas, data, titulo) {
    const ctx = document.getElementById(idCanvas).getContext('2d');
    const labels = Object.keys(data);
    const valores = Object.values(data);

    const grafico = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: valores,
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true
        }
    });
    graficos.push(grafico);
}

// Función para generar un gráfico de dona (doughnut)
function generarGraficoDona(idCanvas, data, titulo) {
    const ctx = document.getElementById(idCanvas).getContext('2d');
    const labels = Object.keys(data);
    const valores = Object.values(data);

    const grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: valores,
                backgroundColor: ['#007bff', '#ffc107', '#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true
        }
    });
    graficos.push(grafico);
}

 // Función para generar el reporte consolidado
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
            if (pedido.fecha && pedido.total) {
                reporte.ventasPorDia[pedido.fecha] = (reporte.ventasPorDia[pedido.fecha] || 0) + pedido.total;
            }

            if (pedido.items && Array.isArray(pedido.items)) {
                pedido.items.forEach((item) => {
                    if (item.nombre && item.cantidad) {
                        reporte.productosVendidos[item.nombre] = (reporte.productosVendidos[item.nombre] || 0) + item.cantidad;
                    }
                });
            }

            if (pedido.mesa && pedido.total) {
                reporte.ventasPorMesa[pedido.mesa] = (reporte.ventasPorMesa[pedido.mesa] || 0) + pedido.total;
            }

            if (pedido.estado) {
                reporte.estadosPedidos[pedido.estado] = (reporte.estadosPedidos[pedido.estado] || 0) + 1;
            }

            if (pedido.metodoPago) {
                reporte.metodosPago[pedido.metodoPago] = (reporte.metodosPago[pedido.metodoPago] || 0) + 1;
            }
        } catch (error) {
            console.warn("Error procesando pedido:", pedido, error);
        }
    });

    return reporte;
}





document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('filtrarReportes');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const estado = document.getElementById('estadoFiltro').value;
            const metodoPago = document.getElementById('metodoPagoFiltro').value;

            fetch(`/reportes/data?inicio=${fechaInicio}&fin=${fechaFin}&estado=${estado}&metodoPago=${metodoPago}`)
                .then(response => response.json())
                .then(data => {
                    generarGraficos(data);
                })
                .catch(error => console.error('Error al filtrar reportes:', error));
        });
    } else {
        console.error('El botón filtrarReportes no se encontró en el DOM.');
    }
});


