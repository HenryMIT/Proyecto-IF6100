DROP DATABASE IF EXISTS DB_Equipo_Rummi;
CREATE DATABASE IF NOT EXISTS DB_Equipo_Rummi;
USE DB_Equipo_Rummi;

CREATE TABLE Categoria_productos (
    id_Categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE Facturas (
    id_Factura INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE DEFAULT CURRENT_TIMESTAMP,
    comentario TEXT,
    estado ENUM('ENTREGADO', 'NO ENTREGADO') DEFAULT 'NO ENTREGADO',
    total DECIMAL(10,2)
);

CREATE TABLE Contactos (
    id_Mensaje INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Usuarios (
	id_usuario INT PRIMARY KEY AUTO_INCREMENT, 
	rol INT NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	clave VARBINARY(64) NOT NULL 
); 

CREATE TABLE Administradores (
	id_administrador INT PRIMARY KEY AUTO_INCREMENT, 
	id_usuario INT, 
	nombre VARCHAR(25),
	primer_apellido VARCHAR(25) NOT NULL,
	segundo_apellido VARCHAR(25) NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	telefono VARCHAR(8) NOT NULL,
	clave VARBINARY(64) NOT NULL,
	FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Clientes (
	id_cliente INT PRIMARY KEY AUTO_INCREMENT, 
	id_usuario INT,
	nombre VARCHAR(25),
	primer_apellido VARCHAR(25) NOT NULL,
	segundo_apellido VARCHAR(25) NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	telefono VARCHAR(8) NOT NULL,
	direccion TEXT NOT NULL,
	clave VARBINARY(64) NOT NULL,
	FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Productos (
    id_Producto INT PRIMARY KEY AUTO_INCREMENT,
    id_Categoria INT NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    descuento DECIMAL(10,2),
    precio DECIMAL(10,2) NOT NULL,
    imagen_producto VARCHAR(200),
    FOREIGN KEY (id_Categoria) REFERENCES Categoria_productos(id_Categoria)
);

CREATE TABLE Factura_Productos (
	id_factura_producto INT PRIMARY KEY AUTO_INCREMENT,
    id_Factura INT NOT NULL,
    id_Producto INT NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_Factura) REFERENCES Facturas(id_Factura),
    FOREIGN KEY (id_Producto) REFERENCES Productos(id_Producto)
)