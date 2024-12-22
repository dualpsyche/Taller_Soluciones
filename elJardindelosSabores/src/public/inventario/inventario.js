const socket = io(); // Conexión al servidor de Socket.IO
document.addEventListener("DOMContentLoaded", () => {
    const productosList = document.getElementById("productos-list");

    // Obtener productos desde el backend
    fetch("/productos")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al cargar los productos");
            }
            return response.json();
        })
        .then((productos) => {
            productosList.innerHTML = ""; // Limpia la tabla

            if (!productos || Object.keys(productos).length === 0) {
                productosList.innerHTML = "<tr><td colspan='5'>No hay productos disponibles.</td></tr>";
                return;
            }

            Object.entries(productos).forEach(([id, producto]) => {
                // Validar que el producto tenga las propiedades necesarias
                if (!producto || !producto.nombre || !producto.precio) {
                    console.warn(`Producto inválido encontrado:`, producto);
                    return; // Ignorar productos inválidos
                }

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${id}</td>
                    <td>${producto.nombre}</td>
                    <td>$${producto.precio}</td>
                    <td>
                        <input type="checkbox" ${producto.activo ? "checked" : ""} 
                               onchange="toggleProductoActivo('${id}', this.checked)">
                    </td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${id}')">Eliminar</button>
                    </td>
                `;
                productosList.appendChild(row);
            });
        })
        .catch((error) => console.error("Error al cargar productos:", error));
});


// Alternar el estado activo del producto
window.toggleProductoActivo = (id, activo) => {
    fetch(`/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Error al actualizar el producto");
            }
            alert("Estado del producto actualizado correctamente.");
        })
        .catch((error) => console.error("Error al actualizar producto:", error));
};



// Eliminar producto
window.eliminarProducto = (id) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
        fetch(`/productos/${id}`, { method: "DELETE" })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error al eliminar el producto");
                }
                alert("Producto eliminado correctamente.");
                location.reload(); // Recargar la página
            })
            .catch((error) => console.error("Error al eliminar producto:", error));
    }
};

socket.on("productosActualizados", () => {
    console.log("Productos actualizados, recargando...");
    location.reload(); // Recargar la página para reflejar los cambios
});