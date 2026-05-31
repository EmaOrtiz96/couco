-- ============================================
-- COUCO AROMAS v3 - Base de Datos Completa
-- Importar en phpMyAdmin
-- ============================================
CREATE DATABASE IF NOT EXISTS couco_aromas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE couco_aromas;

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT,
    nombre VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    descripcion_corta VARCHAR(300),
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2) DEFAULT NULL,
    stock INT DEFAULT 0,
    imagen VARCHAR(255),
    notas_olfativas TEXT,
    volumen VARCHAR(50),
    destacado TINYINT(1) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) DEFAULT NULL,
    google_id VARCHAR(100) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    rol ENUM('cliente','admin') DEFAULT 'cliente',
    reset_token VARCHAR(100) DEFAULT NULL,
    reset_expiry DATETIME DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (usuario_id, producto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (usuario_id, producto_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT DEFAULT NULL,
    nombre_cliente VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20),
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','pagado','preparando','enviado','entregado','cancelado') DEFAULT 'pendiente',
    mp_preference_id VARCHAR(255) DEFAULT NULL,
    mp_payment_id VARCHAR(255) DEFAULT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    nombre_producto VARCHAR(200),
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    mensaje TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suscriptores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── DATOS DE EJEMPLO ──────────────────────────────
INSERT IGNORE INTO categorias (nombre, slug, descripcion, orden) VALUES
('Perfumes','perfumes','Fragancias únicas naturales',1),
('Jabones Artesanales','jabones','Jabones naturales a mano',2),
('Velas Aromáticas','velas','Velas de cera de soja',3),
('Difusores','difusores','Difusores para el hogar',4),
('Sets & Regalos','sets','Colecciones especiales',5);

INSERT IGNORE INTO productos (categoria_id,nombre,slug,descripcion_corta,descripcion,precio,precio_oferta,stock,notas_olfativas,volumen,destacado) VALUES
(1,'Noir Essence','noir-essence','Fragancia oscura y seductora','Una fragancia sofisticada que combina la intensidad del oud con la frescura del bergamot.',85.00,NULL,25,'Salida: Bergamot | Corazón: Rosa, Oud | Fondo: Sándalo','50ml',1),
(1,'Fleur Blanche','fleur-blanche','Elegancia floral con jazmín','Una composición floral etérea inspirada en los jardines del Mediterráneo.',75.00,65.00,18,'Salida: Neroli | Corazón: Jazmín, Nardo | Fondo: Musgo Blanco','50ml',1),
(1,'Bosque Sagrado','bosque-sagrado','Fragancia terrosa y fresca','Inspirada en los bosques de pino y eucalipto.',70.00,NULL,30,'Salida: Eucalipto | Corazón: Pino, Vetiver | Fondo: Cedro','50ml',1),
(2,'Jabón de Rosa & Argán','jabon-rosa-argan','Jabón hidratante premium','Con aceite de argán marroquí y pétalos de rosa.',18.00,NULL,50,NULL,'100g',1),
(2,'Jabón de Lavanda','jabon-lavanda','Relajante con lavanda francesa','Con lavanda de la Provenza francesa.',16.00,NULL,45,NULL,'100g',0),
(2,'Jabón de Carbón Activado','jabon-carbon','Purificante con carbón','Purifica y desintoxica la piel.',20.00,16.00,35,NULL,'100g',1),
(3,'Vela Ámbar & Vainilla','vela-ambar-vainilla','Notas cálidas y dulces','Cera de soja 100% natural. 40 horas de quemado.',32.00,NULL,40,NULL,'200g',1),
(3,'Vela Meditación','vela-meditacion','Para momentos de paz','Con incienso, sándalo y patchouli.',28.00,NULL,35,NULL,'180g',0),
(4,'Difusor Bambú & Teca','difusor-bambu','Notas orientales','Con varillas de ratán. Duración 3 meses.',45.00,NULL,20,NULL,'100ml',1),
(5,'Set Romántico','set-romantico','Set perfecto para regalar','Perfume 30ml + Vela + Jabón de Rosa. Presentación de lujo.',95.00,85.00,15,NULL,'Set completo',1);

-- Admin: admin@coucoaromas.com / Admin1234!
INSERT IGNORE INTO usuarios (nombre,email,password_hash,rol) VALUES
('Administrador','admin@coucoaromas.com','$2b$12$0/5Pa0jF3hd6.gyaQ8kTA.uSJiGpX7dl3.mk4FV/eAvmpQcjeKZFa','admin');
