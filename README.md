# Proyecto-IF6100 — Equipo Rummi

> 🌐 **Idioma / Language:** [Español](#-español) · [English](#-english)

Plataforma web full‑stack para la gestión y venta de **electrodomésticos y equipos de cocina** de *Equipo Rummi*. Incluye catálogo de productos, carrito de compras, facturación, pago en línea, panel administrativo y autenticación con JWT.

---

## 🇪🇸 Español

### Descripción

Aplicación full‑stack compuesta por una **API REST en FastAPI**, un **frontend en Angular** y una **base de datos MySQL** basada en procedimientos y funciones almacenadas. Permite a los clientes navegar el catálogo, agregar productos al carrito y pagar; y a los administradores gestionar productos, categorías, clientes, contactos y facturas.

### Tecnologías

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Angular 20, Angular Material, TailwindCSS 4, Flowbite, RxJS, jsPDF (facturas PDF), `@auth0/angular-jwt`, PayPal |
| **Backend** | Python, FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn, PyMySQL, `python-jose` (JWT), `passlib`/`bcrypt`, servicio de correo SMTP |
| **Base de datos** | MySQL (procedimientos y funciones almacenadas) |

### Funcionalidades principales

- 🛒 Catálogo de productos con imágenes y categorías
- 🧺 Carrito de compras y pago en línea (PayPal)
- 🧾 Generación de facturas en PDF
- 👤 Autenticación y registro (clientes y administradores) con JWT
- 🛠️ Panel administrativo (CRUD de productos, categorías, clientes, contactos y facturas)
- ✉️ Formulario de contacto y envío de correos

### Estructura del proyecto

```
Proyecto-IF6100/
├── BackEnd/datos/        # API FastAPI
│   ├── main.py           # Punto de entrada y registro de routers
│   ├── config.py         # Configuración (variables de entorno)
│   ├── databases.py      # Conexión SQLAlchemy a MySQL
│   ├── auth/             # Autenticación y JWT
│   ├── models/           # Modelos ORM
│   ├── schemas/          # Esquemas Pydantic
│   ├── routes/           # Endpoints (productos, clientes, facturas, etc.)
│   ├── services/         # Servicio de correo
│   ├── utils/            # Utilidades (gestión de archivos)
│   └── uploads/          # Imágenes de productos
├── Frontend/             # Aplicación Angular
│   └── src/app/components/   # Componentes (home, productos, carrito, login, etc.)
└── database/             # Scripts SQL (esquema y procedimientos almacenados)
```

### Requisitos previos

- [Node.js](https://nodejs.org/) 18+ y npm
- [Angular CLI](https://angular.dev/tools/cli) 20
- [Python](https://www.python.org/) 3.11+
- [MySQL](https://www.mysql.com/) 8+

### Instalación y ejecución

#### 1. Base de datos

Crea la base de datos en MySQL y ejecuta los scripts de la carpeta `database/` (primero `db.sql`, luego los `almacenados_*.sql` y `proc_almac_misc.sql`).

#### 2. Backend (FastAPI)

```bash
cd BackEnd/datos
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Crea un archivo `.env` dentro de `BackEnd/datos/` con tus credenciales:

```env
MYSQL_USER=tu_usuario
MYSQL_PASSWORD=tu_contraseña
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=nombre_base_datos

JWT_SECRET=clave_secreta
JWT_ALG=HS256
JWT_EXPIRE_MINUTES=60

EMAIL_HOST=smtp.tu_proveedor.com
EMAIL_USER=tu_correo
EMAIL_CODE=tu_clave_app
```

Inicia el servidor:

```bash
uvicorn main:app --reload
```

La API quedará disponible en `http://localhost:8000` y la documentación interactiva en `http://localhost:8000/docs`.

#### 3. Frontend (Angular)

```bash
cd Frontend
npm install
npm start
```

La aplicación quedará disponible en `http://localhost:4200`.

### Autores

- Henry González Herrera
- Deymer Jiménez
- Jean Carlos Gutiérrez Carrillo
- Jefferson Bonilla
- Xavier Marín

---

## 🇬🇧 English

### Description

Full‑stack application made up of a **FastAPI REST API**, an **Angular frontend**, and a **MySQL database** powered by stored procedures and functions. Customers can browse the catalog, add products to the cart, and check out; administrators can manage products, categories, customers, contacts, and invoices.

### Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Angular 20, Angular Material, TailwindCSS 4, Flowbite, RxJS, jsPDF (PDF invoices), `@auth0/angular-jwt`, PayPal |
| **Backend** | Python, FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn, PyMySQL, `python-jose` (JWT), `passlib`/`bcrypt`, SMTP email service |
| **Database** | MySQL (stored procedures and functions) |

### Key features

- 🛒 Product catalog with images and categories
- 🧺 Shopping cart and online checkout (PayPal)
- 🧾 PDF invoice generation
- 👤 Authentication and registration (customers and admins) with JWT
- 🛠️ Admin panel (CRUD for products, categories, customers, contacts, and invoices)
- ✉️ Contact form and email sending

### Project structure

```
Proyecto-IF6100/
├── BackEnd/datos/        # FastAPI API
│   ├── main.py           # Entry point and router registration
│   ├── config.py         # Configuration (environment variables)
│   ├── databases.py      # SQLAlchemy connection to MySQL
│   ├── auth/             # Authentication and JWT
│   ├── models/           # ORM models
│   ├── schemas/          # Pydantic schemas
│   ├── routes/           # Endpoints (products, customers, invoices, etc.)
│   ├── services/         # Email service
│   ├── utils/            # Utilities (file management)
│   └── uploads/          # Product images
├── Frontend/             # Angular application
│   └── src/app/components/   # Components (home, products, cart, login, etc.)
└── database/             # SQL scripts (schema and stored procedures)
```

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Angular CLI](https://angular.dev/tools/cli) 20
- [Python](https://www.python.org/) 3.11+
- [MySQL](https://www.mysql.com/) 8+

### Setup and run

#### 1. Database

Create the database in MySQL and run the scripts in the `database/` folder (first `db.sql`, then the `almacenados_*.sql` files and `proc_almac_misc.sql`).

#### 2. Backend (FastAPI)

```bash
cd BackEnd/datos
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `BackEnd/datos/` with your credentials:

```env
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=database_name

JWT_SECRET=secret_key
JWT_ALG=HS256
JWT_EXPIRE_MINUTES=60

EMAIL_HOST=smtp.your_provider.com
EMAIL_USER=your_email
EMAIL_CODE=your_app_password
```

Start the server:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000` and the interactive docs at `http://localhost:8000/docs`.

#### 3. Frontend (Angular)

```bash
cd Frontend
npm install
npm start
```

The app will be available at `http://localhost:4200`.

### Authors

- Henry González Herrera
- Deymer Jiménez
- Jean Carlos Gutiérrez Carrillo
- Jefferson Bonilla
- Xavier Marín
