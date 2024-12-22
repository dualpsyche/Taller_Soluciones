const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

let serviceAccount;

// Usa archivo JSON si está disponible, de lo contrario usa variables de entorno
try {
    serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://jardindelos-a7939-default-rtdb.firebaseio.com/'
    });
    console.log("Inicializado con archivo JSON.");
} catch (error) {
    console.log("Archivo JSON no encontrado, usando variables de entorno...");
    admin.initializeApp({
        credential: admin.credential.cert({
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Transforma \\n en saltos reales
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            project_id: process.env.FIREBASE_PROJECT_ID
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const database = admin.database();
const productosRef = database.ref("Productos");

// Lista de productos
const productos = [
    {
      id: "1",
      nombre: "Hamburguesa",
      precio: 4500,
      activo: true,
      categoria: "Platos Más Pedidos",
      ingredientes: ["Carne de res", "Lechuga", "Tomate", "Queso cheddar", "Salsa especial"],
      imagen: "img/hamburgesa.jpg"
    },
    {
      id: "2",
      nombre: "Paella",
      precio: 6000,
      activo: true,
      categoria: "Platos Más Pedidos",
      ingredientes: ["Arroz", "Mariscos frescos", "Pollo", "Especias tradicionales"],
      imagen: "img/paella.jpg"
    },
    {
      id: "3",
      nombre: "Bruschetta de tomate y albahaca",
      precio: 3000,
      activo: true,
      categoria: "Entradas",
      ingredientes: ["Pan tostado", "Tomate fresco", "Albahaca", "Aceite de oliva"],
      imagen: "img/bruschetta.jpg"
    },
    {
      id: "4",
      nombre: "Ensalada Caprese",
      precio: 3500,
      activo: true,
      categoria: "Entradas",
      ingredientes: ["Tomate", "Mozzarella fresca", "Albahaca", "Aceite de oliva", "Vinagre balsámico"],
      imagen: "img/ensaladacaprese.jpg"
    },
    {
      id: "5",
      nombre: "Sopa de calabaza",
      precio: 3000,
      activo: true,
      categoria: "Entradas",
      ingredientes: ["Calabaza", "Crema", "Especias"],
      imagen: "img/sopacalavaza.jpg"
    },
    {
      id: "6",
      nombre: "Filete de res con puré de papas",
      precio: 5500,
      activo: true,
      categoria: "Platos Principales",
      ingredientes: ["Filete de res", "Puré de papas", "Salsa de champiñones"],
      imagen: "img/filete.png"
    },
    {
      id: "7",
      nombre: "Arroz con verduras",
      precio: 5000,
      activo: true,
      categoria: "Platos Principales",
      ingredientes: ["Arroz", "Zanahorias", "Guisantes", "Pimientos"],
      imagen: "img/arrozsalteado.jpg"
    },
    {
      id: "8",
      nombre: "Tarta de manzana",
      precio: 4500,
      activo: true,
      categoria: "Postres",
      ingredientes: ["Manzanas caramelizadas", "Canela", "Masa crujiente"],
      imagen: "img/tarta_manzana_8.jpg"
    },
    {
      id: "9",
      nombre: "Brownie de chocolate",
      precio: 3500,
      activo: true,
      categoria: "Postres",
      ingredientes: ["Chocolate", "Helado de vainilla", "Salsa de chocolate"],
      imagen: "img/brownie.jpg"
    },
    {
      id: "10",
      nombre: "Panna cotta de vainilla",
      precio: 4000,
      activo: true,
      categoria: "Postres",
      ingredientes: ["Crema cocida", "Vainilla", "Frutos rojos"],
      imagen: "img/pannacotta_vainilla.jpg"
    },
    {
      id: "11",
      nombre: "Cerveza Kunstmann Torobayo 500cc",
      precio: 3000,
      activo: true,
      categoria: "Insumos",
      ingredientes: ["Malta tostada", "Cebada"],
      imagen: "img/torobayo.jpg"
    },
    {
      id: "12",
      nombre: "Cerveza Austral Calafate 500cc",
      precio: 3000,
      activo: true,
      categoria: "Insumos",
      ingredientes: ["Cebada", "Calafate"],
      imagen: "img/australcalafate.jpg"
    },
    {
      id: "13",
      nombre: "Negroni",
      precio: 6900,
      activo: true,
      categoria: "Insumos",
      ingredientes: ["Ginebra", "Vermut rojo", "Campari"],
      imagen: "img/negroni.png"
    },
    {
      id: "14",
      nombre: "Vino Miguel Torres Santa Digna Gran Reserva",
      precio: 20000,
      activo: true,
      categoria: "Insumos",
      ingredientes: ["Vino tinto"],
      imagen: "img/vinotinto.avif"
    }
  ];
  
// Insertar productos en Firebase
productos.forEach((producto) => {
    productosRef.child(producto.id).set(producto)
        .then(() => console.log(`Producto ${producto.nombre} agregado correctamente.`))
        .catch((error) => console.error('Error al agregar producto:', error));
});

module.exports = { admin, database };
