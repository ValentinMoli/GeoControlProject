------------------------------------------------------------
-- 1) Crear base de datos principal
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
IF OBJECT_ID('dbo.UserProfessions', 'U') IS NOT NULL
    DROP TABLE dbo.UserProfessions;
GO
IF OBJECT_ID('dbo.Controls', 'U') IS NOT NULL
    DROP TABLE dbo.Controls;
GO
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;
GO
IF OBJECT_ID('dbo.Professions', 'U') IS NOT NULL
    DROP TABLE dbo.Professions;
GO

CREATE TABLE dbo.Professions (
    Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL UNIQUE
);
GO

------------------------------------------------------------
-- 3) Tabla Users
------------------------------------------------------------
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
GO

------------------------------------------------------------
-- 4) Tabla Controls
------------------------------------------------------------
CREATE TABLE dbo.Controls (
    Id              INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Title           NVARCHAR(255) NOT NULL,
    Description     NVARCHAR(MAX),
    Latitude        FLOAT NOT NULL,
    Longitude       FLOAT NOT NULL,
    Address         NVARCHAR(500) NOT NULL,
    ProfessionId    INT NOT NULL,
    ImageBase64     NVARCHAR(MAX),
    Status          NVARCHAR(50) NOT NULL, -- Pending, Completed, Expired
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_Controls_CreatedAt DEFAULT (SYSUTCDATETIME()),
    ExpiresAt       DATETIME2 NOT NULL,
    AssignedUserId  INT NOT NULL
);

ALTER TABLE dbo.Controls
ADD CONSTRAINT FK_Controls_Users
    FOREIGN KEY (AssignedUserId) REFERENCES dbo.Users(Id);
GO

------------------------------------------------------------
-- 5) Tabla UserProfessions 
------------------------------------------------------------
CREATE TABLE dbo.UserProfessions (
    UserId       INT NOT NULL,
    ProfessionId INT NOT NULL,
    AssignedAt   DATETIME2 NOT NULL CONSTRAINT DF_UserProfessions_AssignedAt DEFAULT (SYSUTCDATETIME()),
    PRIMARY KEY (UserId, ProfessionId),
    FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
    FOREIGN KEY (ProfessionId) REFERENCES dbo.Professions(Id)
);
GO

------------------------------------------------------------
-- 6) Datos iniciales
------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = 'valentinmoli12@gmail.com')
BEGIN
    INSERT INTO dbo.Users (Email, Password, Role, FullName, PhoneNumber, ProfessionId)
    VALUES ('valentinmoli12@gmail.com', '1234', 1, N'Valentin Molinuevo', NULL, NULL);
END
GO
