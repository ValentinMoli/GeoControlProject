------------------------------------------------------------
 -- Base de datos para 2FA
------------------------------------------------------------
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'GeoControlAuthDB')
BEGIN
    CREATE DATABASE GeoControlAuthDB;
END
GO

USE GeoControlAuthDB;
GO

IF OBJECT_ID('dbo.TwoFactorCodes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TwoFactorCodes (
        Id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserId      INT NOT NULL,
        Code        NVARCHAR(20) NOT NULL,
        CreatedAt   DATETIME2 NOT NULL CONSTRAINT DF_TwoFactorCodes_CreatedAt DEFAULT (SYSUTCDATETIME()),
        ExpiresAt   DATETIME2 NOT NULL,
        Used        BIT NOT NULL CONSTRAINT DF_TwoFactorCodes_Used DEFAULT (0)
    );

    CREATE INDEX IX_TwoFactorCodes_UserId_Code
        ON dbo.TwoFactorCodes(UserId, Code);

    CREATE INDEX IX_TwoFactorCodes_ExpiresAt
        ON dbo.TwoFactorCodes(ExpiresAt);
END
GO
