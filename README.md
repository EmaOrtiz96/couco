# 🌸 Couco Aromas — Versión 3 Completa

## ¿Qué incluye esta versión?
- ✅ Tienda completa con categorías y búsqueda en tiempo real
- ✅ Carrito con sidebar animado
- ✅ Registro, login y recuperar contraseña por email
- ✅ Subida de imágenes de productos (se convierten a WebP)
- ✅ Reseñas con estrellas en cada producto
- ✅ Lista de favoritos por usuario
- ✅ Checkout con integración MercadoPago
- ✅ Tracking de pedidos para el cliente
- ✅ Panel Admin completo (Dashboard, Productos, Categorías, Pedidos, Mensajes, Suscriptores, Usuarios)
- ✅ Gráfico de ventas por mes en el Admin
- ✅ Buscador global en navbar + buscador de productos en Admin
- ✅ Emails automáticos (bienvenida, confirmación de pedido, recuperar contraseña)

---

## 🚀 Puesta en marcha (paso a paso)

### 1. Base de datos
1. Abre **phpMyAdmin** (http://localhost/phpmyadmin)
2. Ve a "Importar" y sube el archivo `backend/database.sql`
3. Listo — crea la BD `couco_aromas` con datos de ejemplo

### 2. Backend (FastAPI)
```bash
cd backend

# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt

# Editar credenciales (ver sección Configuración abajo)
# Abrir backend/.env con el bloc de notas

# Iniciar servidor
python -m uvicorn main:app --reload --port 8000
```
El backend queda en: http://localhost:8000  
Documentación API: http://localhost:8000/docs

### 3. Frontend (React)
```bash
cd frontend

# Instalar paquetes (solo la primera vez)
npm install

# Iniciar en modo desarrollo
npm run dev
```
La tienda queda en: **http://localhost:5173**

---

## ⚙️ Configuración (backend/.env)

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=          ← tu contraseña de MySQL (vacío si no tienes)
DB_NAME=couco_aromas

SECRET_KEY=couco-aromas-secret-cambiar-en-produccion-2024

# MercadoPago — obtener en mercadopago.com/developers
MP_ACCESS_TOKEN=TEST-tu-access-token-aqui
MP_PUBLIC_KEY=TEST-tu-public-key-aqui

# Email (Gmail) — necesita App Password de Google
MAIL_USER=tu@gmail.com
MAIL_PASS=xxxx-xxxx-xxxx-xxxx   ← App Password, NO tu contraseña normal

FRONTEND_URL=http://localhost:5173
```

### Cómo obtener las credenciales de MercadoPago:
1. Ir a https://www.mercadopago.com.ar/developers
2. Crear una aplicación
3. Copiar **Access Token** y **Public Key** de la sección "Credenciales"
4. Usar las de TEST para probar, las de Producción para vender de verdad

### Cómo obtener App Password de Gmail:
1. Ir a tu cuenta Google → Seguridad → Verificación en 2 pasos (activarla)
2. Ir a Seguridad → Contraseñas de aplicaciones
3. Crear una nueva → copiar las 16 letras que aparecen

---

## 👤 Admin por defecto
- **Email:** admin@coucoaromas.com
- **Contraseña:** Admin1234!
- Entrar en: http://localhost:5173/admin

---

## 📁 Estructura del proyecto
```
couco_aromas_v3/
├── backend/
│   ├── main.py              ← Punto de entrada FastAPI
│   ├── requirements.txt
│   ├── database.sql         ← Importar en phpMyAdmin
│   ├── .env                 ← Configuración (credenciales)
│   ├── uploads/             ← Imágenes subidas (se crea automático)
│   └── app/
│       ├── auth.py          ← JWT + bcrypt
│       ├── database.py      ← Conexión MySQL
│       ├── routers/
│       │   ├── auth.py      ← Registro, login, recuperar contraseña
│       │   ├── productos.py ← CRUD + búsqueda + imágenes
│       │   ├── pedidos.py   ← Pedidos + MercadoPago webhook
│       │   ├── extras.py    ← Reseñas + favoritos
│       │   └── otros.py     ← Categorías, contacto, stats admin
│       └── utils/
│           └── email.py     ← Emails automáticos
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── public/logo.png
    └── src/
        ├── App.jsx           ← Rutas
        ├── api.js            ← Cliente API
        ├── context/          ← Auth + Cart
        ├── hooks/            ← useToast
        ├── components/
        │   ├── Navbar        ← Con buscador global
        │   ├── CartSidebar   ← Carrito lateral
        │   └── ProductCard   ← Tarjeta de producto
        └── pages/
            ├── Home          ← Tienda principal
            ├── Login         ← Login / Registro / Recuperar
            ├── Checkout      ← Pago con MercadoPago
            ├── Admin         ← Panel completo
            └── Extra         ← Favoritos + Mis Pedidos
```
