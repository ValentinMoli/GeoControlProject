------------------------------------------------------------
-- 1) Creo base de datos
------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'GeoControlDB')
BEGIN
    CREATE DATABASE GeoControlDB;
END
GO

USE GeoControlDB;
GO

------------------------------------------------------------
-- 2) Tabla Professions 
------------------------------------------------------------
IF OBJECT_ID('dbo.Professions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Professions (
        Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name        NVARCHAR(100) NOT NULL UNIQUE
    );
END
GO

------------------------------------------------------------
-- 3) Tabla Users 
------------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Email           NVARCHAR(100) NOT NULL UNIQUE,
        Password        NVARCHAR(200) NOT NULL,
        Role            INT NOT NULL,
        FullName        NVARCHAR(200) NOT NULL,
        PhoneNumber     NVARCHAR(50) NULL,
        ProfessionId    INT NULL,
        IsActive        BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME())
    );

    ALTER TABLE dbo.Users
    ADD CONSTRAINT CK_Users_Role CHECK (Role IN (1, 2));
END
GO

------------------------------------------------------------
-- 4) Tabla Controls 
------------------------------------------------------------
IF OBJECT_ID('dbo.Controls', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Controls (
        Id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Title           NVARCHAR(255) NOT NULL,
        Description     NVARCHAR(MAX),
        Latitude        FLOAT NOT NULL,
        Longitude       FLOAT NOT NULL,
        Address         NVARCHAR(500) NOT NULL,
        ProfessionId    INT NOT NULL,
        ImageBase64     NVARCHAR(MAX),
        Status          NVARCHAR(50) NOT NULL,
        CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_Controls_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ExpiresAt       DATETIME2 NOT NULL,
        AssignedUserId  INT NOT NULL
    );

    ALTER TABLE dbo.Controls
    ADD CONSTRAINT FK_Controls_Users
        FOREIGN KEY (AssignedUserId) REFERENCES dbo.Users(Id);
END
GO

------------------------------------------------------------
-- 5) Tabla UserProfessions 
------------------------------------------------------------
IF OBJECT_ID('dbo.UserProfessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserProfessions (
        UserId       INT NOT NULL,
        ProfessionId INT NOT NULL,
        AssignedAt   DATETIME2 NOT NULL CONSTRAINT DF_UserProfessions_AssignedAt DEFAULT (SYSUTCDATETIME()),
        PRIMARY KEY (UserId, ProfessionId),
        FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        FOREIGN KEY (ProfessionId) REFERENCES dbo.Professions(Id)
    );
END
GO

------------------------------------------------------------
-- Añado datos iniciales
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Professions WHERE Name = N'Carpintero')
    INSERT INTO dbo.Professions (Name) VALUES (N'Carpintero');
IF NOT EXISTS (SELECT 1 FROM dbo.Professions WHERE Name = N'Albañil')
    INSERT INTO dbo.Professions (Name) VALUES (N'Albañil');
IF NOT EXISTS (SELECT 1 FROM dbo.Professions WHERE Name = N'Plomero')
    INSERT INTO dbo.Professions (Name) VALUES (N'Plomero');
IF NOT EXISTS (SELECT 1 FROM dbo.Professions WHERE Name = N'Gasista')
    INSERT INTO dbo.Professions (Name) VALUES (N'Gasista');
IF NOT EXISTS (SELECT 1 FROM dbo.Professions WHERE Name = N'Electricista')
    INSERT INTO dbo.Professions (Name) VALUES (N'Electricista');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'valentinmoli12@gmail.com')
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('valentinmoli12@gmail.com', '1234', 1, N'Valentin Molinuevo', NULL, NULL);

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'azunino@gmail.com')
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('azunino@gmail.com', '1234', 1, N'Alejandro Zunino', NULL, NULL);
GO


IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'juanperez@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('juanperez@gmail.com', '1234', 2, N'Juan Perez', NULL,
        (SELECT Id FROM dbo.Professions WHERE Name = N'Albañil'));

    INSERT INTO dbo.UserProfessions (UserId, ProfessionId)
    VALUES (
        (SELECT Id FROM dbo.Users WHERE Email = 'juanperez@gmail.com'),
        (SELECT Id FROM dbo.Professions WHERE Name = N'Carpintero')
    );
END
GO


IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'pedrolopez@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('pedrolopez@gmail.com', '1234', 2, N'Pedro Lopez', NULL,
        (SELECT Id FROM dbo.Professions WHERE Name = N'Carpintero'));

    INSERT INTO dbo.UserProfessions (UserId, ProfessionId)
    VALUES (
        (SELECT Id FROM dbo.Users WHERE Email = 'pedrolopez@gmail.com'),
        (SELECT Id FROM dbo.Professions WHERE Name = N'Albañil')
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'fabianrodriguez@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('fabianrodriguez@gmail.com', '1234', 2, N'Fabian Rodriguez', NULL,
        (SELECT Id FROM dbo.Professions WHERE Name = N'Gasista'));

    INSERT INTO dbo.UserProfessions (UserId, ProfessionId)
    VALUES (
        (SELECT Id FROM dbo.Users WHERE Email = 'fabianrodriguez@gmail.com'),
        (SELECT Id FROM dbo.Professions WHERE Name = N'Plomero')
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'jorgegonzales@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('jorgegonzales@gmail.com', '1234', 2, N'Jorge Gonzales', NULL,
        (SELECT Id FROM dbo.Professions WHERE Name = N'Plomero'));

    INSERT INTO dbo.UserProfessions (UserId, ProfessionId)
    VALUES (
        (SELECT Id FROM dbo.Users WHERE Email = 'jorgegonzales@gmail.com'),
        (SELECT Id FROM dbo.Professions WHERE Name = N'Gasista')
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'MH@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('MH@gmail.com', '12345', 2, N'Mariano Hernandez', NULL,
        (SELECT Id FROM dbo.Professions WHERE Name = N'Electricista'));
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Reparación de pérdida en cañería')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Reparación de pérdida en cañería',
            N'Revisión y reparación de fuga de agua en cañería interna. Incluye detección del punto de pérdida, sellado o reemplazo del tramo afectado.',
            -37.3227763, -59.1273789,
            N'San Martín, 1220, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Plomero'),
            N'Completed', '2026-03-19 13:46:46', '2026-03-19 18:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'jorgegonzales@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Instalación de toma corriente')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Instalación de toma corriente',
            N'Colocación de nuevo enchufe en pared, conexionado a la red existente y verificación de tensión y seguridad.',
            -37.3192362, -59.1228273,
            N'Moreno, 724, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Electricista'),
            N'Completed', '2026-03-19 13:47:31', '2026-03-20 12:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'MH@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Instalación de luminaria LED')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Instalación de luminaria LED',
            N'Colocación de artefacto de iluminación LED en techo o pared, conexión eléctrica y prueba de encendido.',
            -37.3216786, -59.1322778,
            N'Avenida Santamarina, 800, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Electricista'),
            N'Expired', '2026-03-19 13:49:54', '2026-03-21 12:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'MH@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Instalación de cocina a gas')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Instalación de cocina a gas',
            N'Conexión de cocina a la red de gas, verificación de sellado y prueba de funcionamiento segura.',
            -37.3225455, -59.1244628,
            N'11 de Septiembre, 540, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Gasista'),
            N'Expired', '2026-03-19 13:50:40', '2026-03-19 16:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'fabianrodriguez@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Colocación de cerámicos')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Colocación de cerámicos',
            N'Instalación de revestimiento cerámico en pisos o paredes, nivelado y sellado de juntas.',
            -37.3176068, -59.1293161,
            N'Garibaldi, 1300, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Albañil'),
            N'Expired', '2026-03-19 13:51:19', '2026-03-22 12:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'juanperez@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Reparación de puerta de madera')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Reparación de puerta de madera',
            N'Ajuste de bisagras, relleno de grietas y restauración general de puerta dañada.',
            -37.3195572, -59.1280438,
            N'Roca, 840, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Carpintero'),
            N'Completed', '2026-03-19 13:52:17', '2026-03-22 12:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'pedrolopez@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Instalación de calefactor')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Instalación de calefactor',
            N'Montaje y conexión de calefactor a gas, incluyendo ventilación adecuada y prueba de encendido.',
            -37.3244939, -59.1214751,
            N'Montiel, 350, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Gasista'),
            N'Completed', '2026-03-19 13:53:07', '2026-03-19 17:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'fabianrodriguez@gmail.com'));

IF NOT EXISTS (SELECT 1 FROM dbo.Controls WHERE Title = N'Cambio de canillas')
    INSERT INTO dbo.Controls (Title, Description, Latitude, Longitude, Address, ProfessionId, Status, CreatedAt, ExpiresAt, AssignedUserId)
    VALUES (N'Cambio de canillas',
            N'',
            -37.3220212, -59.1410086,
            N'Garibaldi, 500, Tandil, Buenos Aires',
            (SELECT Id FROM dbo.Professions WHERE Name = N'Plomero'),
            N'Expired', '2026-03-23 11:25:00', '2026-03-23 18:00:00',
            (SELECT Id FROM dbo.Users WHERE Email = 'jorgegonzales@gmail.com'));
GO
