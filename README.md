# Proyecto: Protección de Rutas (Educativo)

## ✍️ Descripción

Este es un proyecto trabajado para la entrega del primer parcial de programacion - 3 UTN. Se trabajo un catalogo y un carrito de compras, TS , HTML Y CSS

Persistencia en localstorage todo en base a data.ts y los usos de gestion de informacion local en el archivo localStorage.ts

Algo muy importante es que se utilizo informacion verdadera el archivo data.ts con la unica modificacion de darle una imagen a UN SOLO producto para contemplar el funcionamiento optimo y como fue resuelto en base a un off src

De la siguiente manera

`  
          <img src="${product.imagen}" alt="${product.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/300x200?text=${product.nombre}'">
`

Asignanod en base a la url dinamica placehold.co parametros de medida y el nombre de cada producto, para demostrar como imagen ese fallback de si no tenia imagen un producto mostrar su nombre con un fondo gris 

# Producto con una imagen hardcodeada solo para mostrar un correcto renderizado en la entrega

  {
    id: 1,
    eliminado: false,
    createdAt: "2024-02-01T08:00:00",
    nombre: "Pizza Muzzarella",
    precio: 4500.0,
    descripcion: "Pizza clásica con salsa de tomate y muzzarella derretida",
    stock: 20,
    imagen: "https://www.shutterstock.com/image-photo/falling-italian-pepperoni-pizza-on-600w-2489309739.jpg",
    disponible: true,
    categorias: [categorias[0]],
  },



### 3. Ejecutar el Proyecto

Para iniciar el servidor de desarrollo de Vite, ejecuta, en el directorio del proyecto

```bash
pnpm run dev
```
Igualmente puede levantarse con 

```
npm run dev
```

La aplicación estará disponible en la URL que aparezca en la terminal (generalmente `http://localhost:5173`).

---