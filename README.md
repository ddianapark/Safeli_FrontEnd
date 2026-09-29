# TP12 - EFSI : React Context

### a. Información o datos específicos que se comparten a través del Context
Se comparte el **estado global de autenticación del usuario**. 
Esto incluye:
- Los datos del usuario logueado (nombre, apellido, email, teléfono, foto de perfil, etc.).
- El token de acceso (necesario para usar la API).
- El estado de carga inicial (`isLoading`).
- Un booleano de sesión activa (`isAuthenticated`).
- Funciones globales para manipular la sesión: `login`, `logout`, `signUp`, `updateProfile` y `changePassword`.

### b. Ruta y nombre del archivo en el que fue creado el Context
El Context fue creado utilizando la función `createContext` en el archivo:
- `src/context/authContext.tsx`

### c. Componente contenedor donde se ubicó el Provider
El `AuthProvider` fue ubicado en la raíz de la navegación de Expo Router para envolver toda la aplicación, en:
- `src/app/_layout.tsx` (Envolviendo al componente `<RootLayout />`).

### d. Componentes que consumen la información mediante el hook `useContext`
La información se consume a través de un custom hook llamado `useAuth` (que internamente ejecuta `useContext(AuthContext)`). Los componentes principales que lo consumen son:
1. **`src/app/home.tsx`**: Consume el `token` del usuario logueado para enviarlo en las peticiones a la API (por ejemplo, en la función `obtenerCaminoSeguro`).
2. **`src/app/perfil.tsx`**: Consume el objeto `user` para mostrar los datos personales en la interfaz, y las funciones `updateProfile` y `logout` para editar el perfil o cerrar la sesión.
3. **`src/app/_layout.tsx` (Componente `AuthGuard`)**: Consume `isAuthenticated` y `isLoading` para proteger las rutas privadas y redirigir al usuario al Login si no tiene una sesión activa.

### e. Justificación técnica del porqué resultaba necesario o conveniente utilizar Context en este caso de uso
El uso de Context resulta necesario en Safeli porque la **autenticación y la identidad del usuario son datos transversales a toda la aplicación**. 
Si no usamos Context, sufriríamos de *Prop Drilling*: tendríamos que pasar el objeto del usuario y el token de acceso de forma manual como "props" desde el componente raíz (`_layout.tsx`), pasando por componentes intermedios que no necesitan esos datos, hasta llegar a las pantallas finales como el Perfil (para mostrar los datos) o el Home (para validar las llamadas a la API). Context nos permite tener una única fuente de la verdad para la sesión del usuario, a la cual cualquier pantalla puede suscribirse directamente para leer sus datos o cerrarla en cualquier momento, haciendo el flujo de la aplicación real, escalable y mantenible.
