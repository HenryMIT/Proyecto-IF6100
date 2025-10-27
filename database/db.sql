DROP DATABASE IF EXISTS DB_Equipo_Rummi;
CREATE DATABASE IF NOT EXISTS DB_Equipo_Rummi;
USE DB_Equipo_Rummi;

CREATE TABLE Categoria_productos (
    id_Categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);


CREATE TABLE Contactos (
    id_Mensaje INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT FALSE,
    tipo INT DEFAULT 0
);


CREATE TABLE Administradores (
	id  INT PRIMARY KEY AUTO_INCREMENT, 
	id_administrador INT, 
	nombre VARCHAR(25),
	primer_apellido VARCHAR(25) NOT NULL,
	segundo_apellido VARCHAR(25) NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	telefono VARCHAR(8) NOT NULL
);
CREATE TABLE Usuarios (
	id INT PRIMARY KEY AUTO_INCREMENT, 
    id_usuario INT,
	rol INT NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	clave VARCHAR(255) NOT NULL,
	ultimo_acceso DATETIME,-- para el refrescameitno de la pagina 
	tkRef VARCHAR(255) DEFAULT NULL -- Token de referencia para la sesión
);

CREATE TABLE Clientes (
	id  INT PRIMARY KEY AUTO_INCREMENT, 
	id_cliente INT,
	nombre VARCHAR(25),
	primer_apellido VARCHAR(25) NOT NULL,
	segundo_apellido VARCHAR(25) NOT NULL,
	correo VARCHAR(255) NOT NULL UNIQUE,
	telefono VARCHAR(8) NOT NULL,
	direccion TEXT NOT NULL
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
CREATE TABLE Facturas (
    id_Factura INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    fecha DATETIME,
    comentario TEXT,
    estado ENUM('ENTREGADO', 'NO ENTREGADO') DEFAULT 'NO ENTREGADO',
    total DECIMAL(10,2),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);
CREATE TABLE Factura_Productos (
	id_factura_producto INT PRIMARY KEY AUTO_INCREMENT,
    id_Factura INT NOT NULL,
    id_Producto INT NOT NULL,
    cantidad INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_Factura) REFERENCES Facturas(id_Factura),
    FOREIGN KEY (id_Producto) REFERENCES Productos(id_Producto)
);

CREATE TABLE counters (
  name VARCHAR(50) PRIMARY KEY,
  val  INT NOT NULL
);

INSERT INTO counters (name, val) VALUES ('id_cliente', 999);
INSERT INTO counters (name, val) VALUES ('id_administrador', 999);

