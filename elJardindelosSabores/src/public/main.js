document.addEventListener("DOMContentLoaded", function () {

    const modalCartItems = document.getElementById('modal-cart-items');
    const modalTotalPriceElement = document.getElementById('total-price');
    const cartModal = document.getElementById('cart-modal');
    const cartCountElement = document.getElementById('cart-count');
    const socket = io();
    let cart = [];
    const mesaId = obtenerParametroMesa(); 

    io.on("connection", (socket) => {
        console.log("Usuario conectado");
    
        socket.on("productoActualizado", () => {
            socket.broadcast.emit("actualizarProductos");
        });
    });

    socket.on("actualizarProductos", () => {
        console.log("Productos actualizados, recargando...");
        location.reload(); // Recarga los productos dinámicamente
    });

    document.addEventListener("DOMContentLoaded", () => {
        fetch("/productos")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al cargar productos");
                }
                return response.json();
            })
            .then((productos) => {
                console.log("Productos disponibles:", productos);
    
                // Deshabilitar botones de productos desactivados
                document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
                    const productId = button.getAttribute("data-id");
                    if (!productos[productId]) {
                        button.disabled = true;
                        button.classList.add("disabled");
                    } else {
                        button.disabled = false;
                        button.classList.remove("disabled");
                    }
                });
            })
            .catch((error) => {
                console.error("Error al cargar productos:", error);
            });
    });

    window.generarBoletaPDF = function() {
        if (!pedidoActual) {
            alert("No hay pedido disponible para generar la boleta.");
            return;
        }
    
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString();
        let y = 20;
    
        // Encabezado
        doc.setFontSize(18);
        doc.text("CUENTA", 105, y, { align: "center" });
        y += 10;
    
        doc.setFontSize(12);
        doc.text(`Mesa N°: ${pedidoActual.mesa || "N/A"}`, 20, y);
        doc.text(`Pedido N°: ${Math.floor(Math.random() * 1000)}`, 20, y + 5);
        doc.text(`Fecha Emisión: ${fecha}`, 20, y + 10);
        y += 20;
    
        // Línea divisoria
        doc.line(20, y, 190, y);
        y += 10;
    
        // Títulos de columnas
        doc.setFontSize(10);
        doc.text("CANT.", 20, y);
        doc.text("DETALLE PRODUCTO", 50, y);
        doc.text("VALOR", 180, y, { align: "right" });
        y += 5;
    
        // Línea divisoria
        doc.line(20, y, 190, y);
        y += 10;
    
        // Detalles del pedido
        pedidoActual.items.forEach((item) => {
            doc.setFontSize(10);
            doc.text(`${item.cantidad}`, 20, y);
            doc.text(`${item.nombre}`, 50, y);
            doc.text(`$${(item.precio * item.cantidad).toFixed(2)}`, 180, y, { align: "right" });
            y += 10;
        });
    
        // Línea divisoria
        y += 5;
        doc.line(20, y, 190, y);
        y += 10;
    
        // Total
        doc.setFontSize(12);
        doc.text("Total $:", 20, y);
        doc.text(`$${pedidoActual.total.toFixed(2)}`, 180, y, { align: "right" });
        y += 10;
    
        // Descuento
        doc.text("Descuento $:", 20, y);
        doc.text("$0.00", 180, y, { align: "right" });
        y += 10;
    
        // Total final
        doc.setFontSize(14);
        doc.text("Total Final $:", 20, y);
        doc.text(`$${pedidoActual.total.toFixed(2)}`, 180, y, { align: "right" });
        y += 15;
    
        // Propina sugerida
        const propina = (pedidoActual.total * 0.05).toFixed(2);
        doc.setFontSize(12);
        doc.text("Propina Sugerida (5%) $:", 20, y);
        doc.text(`$${propina}`, 180, y, { align: "right" });
        y += 15;
    
        // Firma
        doc.line(20, y, 100, y);
        doc.text("Firma:", 20, y + 5);
        y += 15;
    
        // Footer
        doc.setFontSize(10);
        doc.text("Gracias por tu preferencia. ¡Te esperamos pronto!", 105, y, { align: "center" });
    
        // Guardar el PDF
        doc.save(`Boleta_Pedido_${new Date().getTime()}.pdf`);
    }
    
    document.addEventListener("DOMContentLoaded", () => {
        const pedidoId = obtenerParametroPedidoId(); // Obtener el ObjectID del pedido
        if (pedidoId) {
            database.ref(`Pedidos/${pedidoId}`).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    pedidoActual = snapshot.val(); // Recupera el pedido
                    actualizarModalEstadoPedido(); // Actualiza el modal con los datos recuperados
                } else {
                    console.log("No hay pedidos activos con este ID.");
                }
            });
        }
    });
    

        document.addEventListener('DOMContentLoaded', () => {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita el comportamiento predeterminado del formulario

            const query = searchInput.value.toLowerCase().trim();
            
            // Selecciona todos los elementos que pueden ser filtrados (ejemplo: filas de una tabla, cards, etc.)
            const elements = document.querySelectorAll('.filterable-item'); // Asegúrate de que los elementos tengan esta clase

            elements.forEach((element) => {
                const textContent = element.textContent.toLowerCase();
                if (textContent.includes(query)) {
                    element.style.display = ''; // Muestra el elemento si coincide
                } else {
                    element.style.display = 'none'; // Oculta el elemento si no coincide
                }
            });
        });
    });

    function guardarPedidoLocalmente(pedido) {
        localStorage.setItem('pedidoActual', JSON.stringify(pedido));
    }
    
    function obtenerParametroPedidoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('pedidoId'); // Cambiar "mesa" por "pedidoId" en las URLs
    }
    

    document.addEventListener("DOMContentLoaded", () => {
        const pedidoGuardado = localStorage.getItem('pedidoActual');
        if (pedidoGuardado) {
            pedidoActual = JSON.parse(pedidoGuardado);
            actualizarModalEstadoPedido(); // Muestra el pedido guardado en el modal
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const pedidoGuardado = localStorage.getItem('pedidoActual');
        if (pedidoGuardado) {
            pedidoActual = JSON.parse(pedidoGuardado);
            actualizarModalEstadoPedido(); // Carga datos desde localStorage
        }
    
        // Luego sincroniza con Firebase para obtener datos actualizados
        const mesaId = obtenerParametroMesa();
        if (mesaId) {
            database.ref(`Pedidos/${mesaId}`).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    pedidoActual = snapshot.val();
                    actualizarModalEstadoPedido();
                    guardarPedidoLocalmente(pedidoActual); // Sincroniza localStorage
                }
            });
        }
    });
    

    let pedidoActual = null; // Variable para almacenar el pedido realizado

    socket.on('nuevoPedido', (pedido) => {
        if (pedido.mesa === mesaId) { // Verifica que el pedido sea de esta mesa
            pedidoActual = pedido; // Guarda el pedido actual
            actualizarModalEstadoPedido(); // Actualiza el modal con los datos del pedido
        }
    });
    
    socket.on('actualizarPedido', (pedido) => {
        if (pedido.mesa === mesaId) { // Verifica que el pedido sea de esta mesa
            pedidoActual = { ...pedidoActual, ...pedido }; // Actualiza el pedido actual
            actualizarModalEstadoPedido(); // Actualiza el modal con los datos del pedido
        }
    });

    document.getElementById("pedidoEstadoModal").addEventListener("show.bs.modal", () => {
        actualizarModalEstadoPedido();
    });
    
    function actualizarModalEstadoPedido() {
        const pedidoProductos = document.getElementById("pedidoProductos");
        const pedidoTotal = document.getElementById("pedidoTotal");
        const pedidoEstado = document.getElementById("pedidoEstado");
        const pedidoTiempo = document.getElementById("pedidoTiempo");
    
        if (pedidoActual) {
            pedidoProductos.innerHTML = ''; // Limpia la lista de productos
    
            // Añadir productos al modal
            pedidoActual.items.forEach((item) => {
                const listItem = document.createElement("li");
                listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
                listItem.innerHTML = `
                    <span>${item.nombre} (x${item.cantidad})</span>
                    <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
                `;
                pedidoProductos.appendChild(listItem);
            });
    
            // Actualizar otros datos del modal
            pedidoTotal.textContent = `$${pedidoActual.total.toFixed(2)}`;
            pedidoEstado.textContent = pedidoActual.estado || "Pendiente";
            pedidoTiempo.textContent = pedidoActual.tiempoEstimado 
                ? `${pedidoActual.tiempoEstimado} minutos`
                : "No disponible";
        } else {
            pedidoProductos.innerHTML = "<li class='list-group-item'>No hay productos en el pedido.</li>";
            pedidoTotal.textContent = "$0.00";
            pedidoEstado.textContent = "Sin Pedido";
            pedidoTiempo.textContent = "No disponible";
        }
    }
    
        function addToCart(name, price) {
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price: parseFloat(price), quantity: 1 });
        }
        updateCartModal();
        updateCartCount();
    }

    window.renderCartItems = function() {
        modalCartItems.innerHTML = '';
        let totalPrice = 0;
        cart.forEach((item, index) => {
            const cartItem = document.createElement('li');
            cartItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            cartItem.setAttribute('data-index', index);
    
            cartItem.innerHTML = `
                <div class="w-75">
                    <h6 class="my-0">${item.name}</h6>
                    <small class="text-muted">$${item.price.toFixed(2)}</small>
                    <div class="input-group mt-2">
                        <button class="btn btn-outline-secondary btn-sm" onclick="decreaseQuantity(${index})">-</button>
                        <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" min="1" onchange="changeQuantity(${index}, this.value)">
                        <button class="btn btn-outline-secondary btn-sm" onclick="increaseQuantity(${index})">+</button>
                    </div>
                </div>

            `;
    
            modalCartItems.appendChild(cartItem);
            totalPrice += item.price * item.quantity;
        });
    
        modalTotalPriceElement.textContent = totalPrice.toFixed(2);
    };

    function updateCartModal() {
        modalCartItems.innerHTML = ''; // Limpiar la lista del modal
        let totalPrice = 0;
        cart.forEach((item, index) => {
            const cartItem = document.createElement('li');
            cartItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            cartItem.setAttribute('data-index', index);

            cartItem.innerHTML = `
                <div class="w-75">
                    <h6 class="my-0">${item.name}</h6>
                    <small class="text-muted">$${item.price.toFixed(2)}</small>
                    <div class="input-group mt-2">
                        <button class="btn btn-outline-secondary btn-sm" onclick="decreaseQuantity(${index})">-</button>
                        <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" min="1" onchange="changeQuantity(${index}, this.value)">
                        <button class="btn btn-outline-secondary btn-sm" onclick="increaseQuantity(${index})">+</button>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm ms-2" onclick="removeItem(${index})">Eliminar</button>
            `;

            modalCartItems.appendChild(cartItem);
            totalPrice += item.price * item.quantity;
        });

        modalTotalPriceElement.textContent = totalPrice.toFixed(2);
    }
    // obtener parametros de la mesa

    function obtenerParametroMesa() {
        const urlParams = new URLSearchParams(window.location.search);
        console.log(urlParams.get('mesa'));
        return urlParams.get('mesa');

    }

    window.removeItem = function(index) {
        cart.splice(index, 1);  // Eliminar el item del carrito
        updateCartModal();      // Actualizar la vista del carrito
        updateCartCount();      // Actualizar el contador de productos en el carrito
    }

    window.changeQuantity = function(index, newQuantity) {
        // Asegúrate de que la cantidad no sea menor que 1
        const quantity = Math.max(1, parseInt(newQuantity));
        cart[index].quantity = quantity;
        renderCartItems(); // Actualiza la vista con el nuevo valor de cantidad
        updateCartTotal();  // Actualiza el total
    };

    window.increaseQuantity = function (index) {
        cart[index].quantity++;
        renderCartItems();
        updateCartTotal();
    };

    window.decreaseQuantity = function (index) {
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
        } else {
            removeItem(index); // Si la cantidad es 1 o menos, eliminar el artículo
            clearCart()
        }
        updateCartModal();
        updateCartCount();
    };

    function updateCartTotal() {
        const total = calcularTotal();  // Get the total from the cart
        if (!isNaN(total)) {  // Check if total is a valid number
            document.getElementById("total-price").textContent = total.toFixed(2);  // Use toFixed only on valid numbers
        } else {
            console.error("Error: total is not a valid number:", total);
            document.getElementById("total-price").textContent = '0.00';  // Fallback to 0.00 if there's an error
        }
    }


    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }

    modalCartItems.addEventListener('click', function(event) {
        if (event.target.classList.contains('cart-item-remove')) {
            const index = event.target.getAttribute('data-index');
            removeFromCart(index);
        }
    });

    function removeFromCart(index) {
        const cartItemElement = document.querySelector(`.cart-item[data-index='${index}']`);
        cartItemElement.classList.add('cart-item-removed');

        setTimeout(() => {
            cart.splice(index, 1);
            updateCartModal();
            updateCartCount();
        }, 300);
    }

    document.getElementById("drink-select").addEventListener("change", (e) => {
        const drinkValue = e.target.value; // el valor (agua, gaseosa, etc.)
        const drinkText = e.target.options[e.target.selectedIndex].text; // el texto completo (e.g., Agua Mineral $1500)
        if (drinkValue !== "Seleccionar bebida...") {
            const price = parseFloat(e.target.options[e.target.selectedIndex].dataset.price) || 1000; // Precio por defecto
            addToCart(drinkText, price, "bebida"); // Agrega el nombre completo al carrito en lugar del valor abreviado
        }
    });
    
    document.getElementById("dessert-select").addEventListener("change", (e) => {
        const dessert = e.target.value;
        if (dessert !== "Seleccionar postre...") {
            const price = parseFloat(e.target.options[e.target.selectedIndex].dataset.price) || 1000;  // Default price if not specified
            addToCart(dessert, price, "postre");  // Use addToCart instead of addItemToCart
        }
    });


    function showCartModal() {
        const modalInstance = new bootstrap.Modal(cartModal);
        modalInstance.show();
    }

    document.getElementById('cartBtn').addEventListener('click', showCartModal);

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', () => {
            const name = button.getAttribute('data-name');
            const price = button.getAttribute('data-price');
            addToCart(name, price);
        });
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    });

    document.getElementById('payCash').addEventListener('click', () => {
        enviarPedido("Efectivo");
    });

    document.getElementById('payCard').addEventListener('click', () => {
        showCardDetailsModal();
    });

    function clearCart() {
        cart = [];
        updateCartModal();
        updateCartCount();
    }

    function showCardDetailsModal() {
        const cardDetailsModal = new bootstrap.Modal(document.getElementById('cardDetailsModal'));
        cardDetailsModal.show();
    }

    document.getElementById('cardForm').addEventListener('submit', function (e) {
        e.preventDefault();
        // Enviar pedido con los detalles de la tarjeta
        enviarPedido("Tarjeta", {
            NombreTitular: document.getElementById("cardHolder").value,
            NumeroTarjeta: document.getElementById("cardNumber").value,
            Expiración: document.getElementById("expiryDate").value,
            CVV: document.getElementById("cardCVV").value
        });
    });

    function obtenerItemsDelCarrito() {
        return cart.map(item => ({
            nombre: item.name,
            precio: item.price,
            cantidad: item.quantity
        }));
    }

    function calcularTotal() {
        // Ensure total is a valid number, defaulting to 0 if not
        const total = cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
        return total;  // Return total as a number, not as a string
    }
    

    async function enviarPedido(metodoPago, detallesTarjeta = null) {
        const itemsDelCarrito = obtenerItemsDelCarrito(); // Obtener los items actualizados del carrito
        const total = calcularTotal(); // Calcular el total actualizado del carrito
        const mesa = obtenerParametroMesa(); // Obtener la mesa desde la URL
        const comentarios = document.getElementById('order-comments').value; // Capturar comentarios
    
        // Obtener la fecha actual en formato YYYY-MM-DD
        const hoy = new Date();
        const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    
        // Crear el objeto del pedido con la fecha
        const pedido = {
            items: itemsDelCarrito,
            total,
            metodoPago,
            mesa, // Agregar el identificador de la mesa
            comentarios, // Añadir comentarios al pedido
            fecha, // Agregar la fecha actual al pedido
            ...(detallesTarjeta && { detallesTarjeta }) // Si hay detalles de tarjeta, agregarlos al pedido
        };
    
        console.log("Pedido que se enviará:", pedido);
    
        try {
            const response = await fetch("/pedido", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedido)
            });
    
            const result = await response.json();
            console.log(result);
    
            if (result.message === "Pedido enviado con éxito") {
                guardarPedidoLocalmente(pedido);
    
                // Ocultar todos los modales abiertos
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modal => {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                });
    
                // Mostrar modal de confirmación de pedido
                const mensajeConfirmacion = new bootstrap.Modal(document.getElementById('pedidoConfirmadoModal'));
                mensajeConfirmacion.show();
    
                // Limpiar el carrito y redirigir
                setTimeout(() => {
                    mensajeConfirmacion.hide();
                    clearCart(); // Limpiar el carrito
                }, 1000);
            } else {
                alert(result.message); // Mostrar mensaje de error si no se pudo procesar el pedido
            }
        } catch (error) {
            console.error("Error al procesar el pedido:", error);
            alert("Hubo un problema al procesar el pedido. Por favor, inténtalo de nuevo.");
        }
    }
    
});
