-- =================================================================
-- Efforts_Tracking Database Setup Script
-- SQL Server LocalDB / SQL Server 2017+
-- Connection: Data Source=(localdb)\MSSQLLocalDB; Integrated Security=True
-- Run this script once to set up the full schema and sample data.
-- Re-running is safe — all objects are dropped and recreated.
-- =================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Efforts_Tracking')
BEGIN
    CREATE DATABASE Efforts_Tracking;
    PRINT 'Database Efforts_Tracking created.';
END
ELSE
    PRINT 'Database Efforts_Tracking already exists.';
GO

USE Efforts_Tracking;
GO

-- =================================================================
-- DROP STORED PROCEDURES (safe re-run)
-- =================================================================
DROP PROCEDURE IF EXISTS dbo.UpdateTimesheetEntry;
DROP PROCEDURE IF EXISTS dbo.DeleteTimesheetEntry;
DROP PROCEDURE IF EXISTS dbo.AuthenticateUser;
DROP PROCEDURE IF EXISTS dbo.CreateUser;
DROP PROCEDURE IF EXISTS dbo.CreateProject;
DROP PROCEDURE IF EXISTS dbo.UpdateProject;
DROP PROCEDURE IF EXISTS dbo.AssignProjectToCandidate;
DROP PROCEDURE IF EXISTS dbo.RemoveProjectAssignment;
DROP PROCEDURE IF EXISTS dbo.InsertTimesheetEntry;
DROP PROCEDURE IF EXISTS dbo.GetTimesheetByMonth;
DROP PROCEDURE IF EXISTS dbo.GetCandidateMonthlyReport;
DROP PROCEDURE IF EXISTS dbo.GetCandidateMonthlyTrend;
DROP PROCEDURE IF EXISTS dbo.GetAdminProjectReport;
DROP PROCEDURE IF EXISTS dbo.GetAllCandidatesReport;
DROP PROCEDURE IF EXISTS dbo.GetAllCandidates;
DROP PROCEDURE IF EXISTS dbo.SetCandidateStatus;
DROP PROCEDURE IF EXISTS dbo.GetAllProjects;
DROP PROCEDURE IF EXISTS dbo.GetAssignedProjects;
DROP PROCEDURE IF EXISTS dbo.UpdateCandidateRates;
GO

-- =================================================================
-- TABLES  (created only if they don't already exist)
-- =================================================================

-- ----------------------------------------------------------------
-- Users  (admins and candidates share this table)
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.Users (
    UserId       INT IDENTITY(1,1) PRIMARY KEY,
    Email        NVARCHAR(255)  NOT NULL,
    PasswordHash NVARCHAR(512)  NOT NULL,
    FullName     NVARCHAR(200)  NOT NULL,
    Role         NVARCHAR(20)   NOT NULL
        CONSTRAINT CK_Users_Role CHECK (Role IN ('admin', 'candidate')),
    IsActive     BIT            NOT NULL CONSTRAINT DF_Users_IsActive    DEFAULT 1,
    CreatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Users_Created     DEFAULT SYSUTCDATETIME(),
    UpdatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Users_Updated     DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);
GO

-- ----------------------------------------------------------------
-- Candidates  (extended profile, one row per candidate user)
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Candidates' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.Candidates (
    CandidateId  INT IDENTITY(1,1) PRIMARY KEY,
    UserId       INT            NOT NULL,
    Phone        NVARCHAR(30)   NULL,
    HourlyRate   DECIMAL(10,2)  NOT NULL CONSTRAINT DF_Cand_HourlyRate  DEFAULT 0,
    FixedAmount  DECIMAL(10,2)  NOT NULL CONSTRAINT DF_Cand_FixedAmount DEFAULT 0,
    AccountNo    NVARCHAR(30)   NULL,
    IFSCCode     NVARCHAR(20)   NULL,
    CreatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Cand_Created     DEFAULT SYSUTCDATETIME(),
    UpdatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Cand_Updated     DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Candidates_UserId UNIQUE (UserId),
    CONSTRAINT FK_Candidates_Users  FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);
GO

-- Add AccountNo / IFSCCode columns to existing Candidates table (safe re-run)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Candidates') AND name = 'AccountNo')
    ALTER TABLE dbo.Candidates ADD AccountNo NVARCHAR(30) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Candidates') AND name = 'IFSCCode')
    ALTER TABLE dbo.Candidates ADD IFSCCode NVARCHAR(20) NULL;
GO

-- ----------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Projects' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.Projects (
    ProjectId    INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(200)  NOT NULL,
    Description  NVARCHAR(1000) NULL,
    IsActive     BIT            NOT NULL CONSTRAINT DF_Proj_IsActive DEFAULT 1,
    CreatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Proj_Created  DEFAULT SYSUTCDATETIME(),
    UpdatedDate  DATETIME2      NOT NULL CONSTRAINT DF_Proj_Updated  DEFAULT SYSUTCDATETIME()
);
GO

-- ----------------------------------------------------------------
-- CandidateProjectMapping
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CandidateProjectMapping' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.CandidateProjectMapping (
    MappingId    INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId  INT  NOT NULL,             -- FK → Users.UserId (candidate only)
    ProjectId    INT  NOT NULL,
    AssignedDate DATE NOT NULL CONSTRAINT DF_CPM_AssignedDate DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    IsActive     BIT  NOT NULL CONSTRAINT DF_CPM_IsActive     DEFAULT 1,
    CreatedDate  DATETIME2 NOT NULL CONSTRAINT DF_CPM_Created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CPM_Candidate FOREIGN KEY (CandidateId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_CPM_Project   FOREIGN KEY (ProjectId)   REFERENCES dbo.Projects(ProjectId),
    CONSTRAINT UQ_CPM_Pair      UNIQUE (CandidateId, ProjectId)
);
GO

-- ----------------------------------------------------------------
-- TimesheetEntries
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TimesheetEntries' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.TimesheetEntries (
    EntryId      INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId  INT           NOT NULL,
    ProjectId    INT           NOT NULL,
    EntryDate    DATE          NOT NULL,
    Hours        DECIMAL(5,2)  NOT NULL
        CONSTRAINT CK_TE_Hours CHECK (Hours > 0 AND Hours <= 24),
    Remarks      NVARCHAR(500) NULL,
    CreatedDate  DATETIME2     NOT NULL CONSTRAINT DF_TE_Created DEFAULT SYSUTCDATETIME(),
    UpdatedDate  DATETIME2     NOT NULL CONSTRAINT DF_TE_Updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_TE_Candidate FOREIGN KEY (CandidateId) REFERENCES dbo.Users(UserId),
    CONSTRAINT FK_TE_Project   FOREIGN KEY (ProjectId)   REFERENCES dbo.Projects(ProjectId)
);
GO

-- ----------------------------------------------------------------
-- Payments  (monthly billing snapshot)
-- ----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Payments' AND schema_id = SCHEMA_ID('dbo'))
CREATE TABLE dbo.Payments (
    PaymentId    INT IDENTITY(1,1) PRIMARY KEY,
    CandidateId  INT          NOT NULL,
    Month        TINYINT      NOT NULL CONSTRAINT CK_Pay_Month CHECK (Month BETWEEN 1 AND 12),
    Year         SMALLINT     NOT NULL,
    TotalHours   DECIMAL(8,2) NOT NULL CONSTRAINT DF_Pay_TotalHours  DEFAULT 0,
    TotalAmount  DECIMAL(12,2) NOT NULL CONSTRAINT DF_Pay_TotalAmount DEFAULT 0,
    CreatedDate  DATETIME2    NOT NULL CONSTRAINT DF_Pay_Created      DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Pay_Candidate        FOREIGN KEY (CandidateId) REFERENCES dbo.Users(UserId),
    CONSTRAINT UQ_Pay_CandMonthYear    UNIQUE (CandidateId, Month, Year)
);
GO

-- =================================================================
-- INDEXES
-- =================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_TE_Candidate_Date' AND object_id=OBJECT_ID('dbo.TimesheetEntries'))
    CREATE INDEX IX_TE_Candidate_Date ON dbo.TimesheetEntries(CandidateId, EntryDate);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_TE_Project_Date' AND object_id=OBJECT_ID('dbo.TimesheetEntries'))
    CREATE INDEX IX_TE_Project_Date   ON dbo.TimesheetEntries(ProjectId, EntryDate);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_CPM_ProjectId' AND object_id=OBJECT_ID('dbo.CandidateProjectMapping'))
    CREATE INDEX IX_CPM_ProjectId ON dbo.CandidateProjectMapping(ProjectId);
GO

-- =================================================================
-- STORED PROCEDURES
-- =================================================================

-- ----------------------------------------------------------------
-- 1. AuthenticateUser
--    Called on login. Returns user row (app layer verifies bcrypt).
-- ----------------------------------------------------------------
GO
CREATE PROCEDURE dbo.AuthenticateUser
    @Email NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId,
        u.Email,
        u.PasswordHash,
        u.Role,
        u.FullName,
        u.IsActive
    FROM dbo.Users u
    WHERE u.Email = @Email;
END
GO

-- ----------------------------------------------------------------
-- 2. CreateUser
--    Creates Users row + Candidates row (for candidate role).
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.CreateUser
    @Email        NVARCHAR(255),
    @PasswordHash NVARCHAR(512),
    @FullName     NVARCHAR(200),
    @Role         NVARCHAR(20)  = 'candidate',
    @Phone        NVARCHAR(30)  = NULL,
    @HourlyRate   DECIMAL(10,2) = 0,
    @FixedAmount  DECIMAL(10,2) = 0,
    @AccountNo    NVARCHAR(30)  = NULL,
    @IFSCCode     NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO dbo.Users (Email, PasswordHash, FullName, Role)
        VALUES (@Email, @PasswordHash, @FullName, @Role);

        DECLARE @NewUserId INT = SCOPE_IDENTITY();

        IF @Role = 'candidate'
        BEGIN
            INSERT INTO dbo.Candidates (UserId, Phone, HourlyRate, FixedAmount, AccountNo, IFSCCode)
            VALUES (@NewUserId, @Phone, @HourlyRate, @FixedAmount, @AccountNo, @IFSCCode);
        END

        SELECT
            u.UserId,
            u.Email,
            u.FullName,
            u.Role,
            u.IsActive,
            c.Phone,
            c.HourlyRate,
            c.FixedAmount,
            c.AccountNo,
            c.IFSCCode,
            u.CreatedDate
        FROM dbo.Users u
        LEFT JOIN dbo.Candidates c ON c.UserId = u.UserId
        WHERE u.UserId = @NewUserId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ----------------------------------------------------------------
-- 3. CreateProject
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.CreateProject
    @Name        NVARCHAR(200),
    @Description NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Projects (Name, Description)
    VALUES (@Name, @Description);

    DECLARE @NewId INT = SCOPE_IDENTITY();

    SELECT ProjectId, Name, Description, IsActive, CreatedDate
    FROM dbo.Projects
    WHERE ProjectId = @NewId;
END
GO

-- ----------------------------------------------------------------
-- 4. UpdateProject
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.UpdateProject
    @ProjectId   INT,
    @Name        NVARCHAR(200)  = NULL,
    @Description NVARCHAR(1000) = NULL,
    @IsActive    BIT            = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Projects
    SET
        Name        = ISNULL(@Name,        Name),
        Description = ISNULL(@Description, Description),
        IsActive    = ISNULL(@IsActive,    IsActive),
        UpdatedDate = SYSUTCDATETIME()
    WHERE ProjectId = @ProjectId;

    SELECT ProjectId, Name, Description, IsActive, CreatedDate, UpdatedDate
    FROM dbo.Projects
    WHERE ProjectId = @ProjectId;
END
GO

-- ----------------------------------------------------------------
-- 5. AssignProjectToCandidate
--    Inserts mapping or reactivates if previously deactivated.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.AssignProjectToCandidate
    @CandidateId INT,
    @ProjectId   INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM dbo.CandidateProjectMapping
        WHERE CandidateId = @CandidateId AND ProjectId = @ProjectId
    )
    BEGIN
        UPDATE dbo.CandidateProjectMapping
        SET IsActive = 1
        WHERE CandidateId = @CandidateId AND ProjectId = @ProjectId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.CandidateProjectMapping (CandidateId, ProjectId)
        VALUES (@CandidateId, @ProjectId);
    END
    SELECT 1 AS Success;
END
GO

-- ----------------------------------------------------------------
-- 6. RemoveProjectAssignment
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.RemoveProjectAssignment
    @CandidateId INT,
    @ProjectId   INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.CandidateProjectMapping
    SET IsActive = 0
    WHERE CandidateId = @CandidateId AND ProjectId = @ProjectId;
    SELECT 1 AS Success;
END
GO

-- ----------------------------------------------------------------
-- 7. InsertTimesheetEntry
--    Validates candidate is assigned to project; inserts entry.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.InsertTimesheetEntry
    @CandidateId INT,
    @ProjectId   INT,
    @EntryDate   DATE,
    @Hours       DECIMAL(5,2),
    @Remarks     NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.CandidateProjectMapping
        WHERE CandidateId = @CandidateId AND ProjectId = @ProjectId AND IsActive = 1
    )
    BEGIN
        RAISERROR('Candidate is not assigned to this project.', 16, 1);
        RETURN;
    END

    INSERT INTO dbo.TimesheetEntries (CandidateId, ProjectId, EntryDate, Hours, Remarks)
    VALUES (@CandidateId, @ProjectId, @EntryDate, @Hours, @Remarks);

    DECLARE @NewId INT = SCOPE_IDENTITY();

    SELECT
        te.EntryId,
        te.ProjectId,
        p.Name    AS ProjectName,
        te.EntryDate,
        te.Hours,
        te.Remarks
    FROM dbo.TimesheetEntries te
    JOIN dbo.Projects p ON p.ProjectId = te.ProjectId
    WHERE te.EntryId = @NewId;
END
GO

-- ----------------------------------------------------------------
-- 8. GetTimesheetByMonth
--    Returns all entries for a candidate in the given month/year.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetTimesheetByMonth
    @CandidateId INT,
    @Month       TINYINT,
    @Year        SMALLINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        te.EntryId,
        te.ProjectId,
        p.Name    AS ProjectName,
        te.EntryDate,
        te.Hours,
        te.Remarks
    FROM dbo.TimesheetEntries te
    JOIN dbo.Projects p ON p.ProjectId = te.ProjectId
    WHERE
        te.CandidateId     = @CandidateId
        AND MONTH(te.EntryDate) = @Month
        AND YEAR(te.EntryDate)  = @Year
    ORDER BY te.EntryDate, p.Name;
END
GO

-- ----------------------------------------------------------------
-- 9. GetCandidateMonthlyReport
--    Returns one row per assigned project.
--    Billing summary columns (TotalHours, HourlyRate, FixedAmount,
--    TotalPayment) are identical in every row — app layer reads once.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetCandidateMonthlyReport
    @CandidateId INT,
    @Month       TINYINT,
    @Year        SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalHours  DECIMAL(8,2);
    DECLARE @HourlyRate  DECIMAL(10,2);
    DECLARE @FixedAmount DECIMAL(10,2);
    DECLARE @FullName    NVARCHAR(200);

    SELECT
        @TotalHours  = ISNULL(SUM(te.Hours), 0)
    FROM dbo.TimesheetEntries te
    WHERE te.CandidateId = @CandidateId
      AND MONTH(te.EntryDate) = @Month
      AND YEAR(te.EntryDate)  = @Year;

    SELECT
        @HourlyRate  = ISNULL(c.HourlyRate,  0),
        @FixedAmount = ISNULL(c.FixedAmount, 0),
        @FullName    = u.FullName
    FROM dbo.Candidates c
    JOIN dbo.Users u ON u.UserId = c.UserId
    WHERE c.UserId = @CandidateId;

    DECLARE @TotalPayment DECIMAL(12,2) =
        (@TotalHours * @HourlyRate) + @FixedAmount;

    SELECT
        p.ProjectId,
        p.Name                                  AS ProjectName,
        ISNULL(SUM(te.Hours), 0)                AS ProjectHours,
        @TotalHours                             AS TotalHours,
        @HourlyRate                             AS HourlyRate,
        @FixedAmount                            AS FixedAmount,
        @TotalPayment                           AS TotalPayment,
        @FullName                               AS FullName,
        @CandidateId                            AS CandidateId,
        @Month                                  AS Month,
        @Year                                   AS Year
    FROM dbo.CandidateProjectMapping cpm
    JOIN dbo.Projects p ON p.ProjectId = cpm.ProjectId
    LEFT JOIN dbo.TimesheetEntries te
        ON  te.CandidateId = @CandidateId
        AND te.ProjectId   = cpm.ProjectId
        AND MONTH(te.EntryDate) = @Month
        AND YEAR(te.EntryDate)  = @Year
    WHERE cpm.CandidateId = @CandidateId AND cpm.IsActive = 1
    GROUP BY p.ProjectId, p.Name
    ORDER BY p.Name;
END
GO

-- ----------------------------------------------------------------
-- 10. GetCandidateMonthlyTrend
--     Returns last @Months months of total hours for a candidate.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetCandidateMonthlyTrend
    @CandidateId INT,
    @Months      INT = 6
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartDate DATE = CAST(
        DATEADD(MONTH, -(@Months - 1), DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1))
    AS DATE);

    SELECT
        YEAR(te.EntryDate)          AS Year,
        MONTH(te.EntryDate)         AS Month,
        ISNULL(SUM(te.Hours), 0)    AS TotalHours
    FROM dbo.TimesheetEntries te
    WHERE te.CandidateId = @CandidateId
      AND te.EntryDate  >= @StartDate
    GROUP BY YEAR(te.EntryDate), MONTH(te.EntryDate)
    ORDER BY Year, Month;
END
GO

-- ----------------------------------------------------------------
-- 11. GetAdminProjectReport
--     Project-wise summary for a given month.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetAdminProjectReport
    @Month TINYINT,
    @Year  SMALLINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ProjectId,
        p.Name                              AS ProjectName,
        COUNT(DISTINCT te.CandidateId)      AS TotalCandidates,
        ISNULL(SUM(te.Hours), 0)            AS TotalHours
    FROM dbo.Projects p
    LEFT JOIN dbo.TimesheetEntries te
        ON  te.ProjectId = p.ProjectId
        AND MONTH(te.EntryDate) = @Month
        AND YEAR(te.EntryDate)  = @Year
    WHERE p.IsActive = 1
    GROUP BY p.ProjectId, p.Name
    ORDER BY p.Name;
END
GO

-- ----------------------------------------------------------------
-- 12. GetAllCandidatesReport
--     One row per (candidate × project) for the month.
--     Frontend groups by candidate and pivots projects for display.
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetAllCandidatesReport
    @Month       TINYINT,
    @Year        SMALLINT,
    @CandidateId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId                                        AS CandidateId,
        u.FullName                                      AS CandidateName,
        u.Email,
        p.ProjectId,
        p.Name                                          AS ProjectName,
        ISNULL(SUM(te.Hours), 0)                        AS ProjectHours,
        ISNULL(
            (SELECT SUM(Hours) FROM dbo.TimesheetEntries
             WHERE CandidateId = u.UserId
               AND MONTH(EntryDate) = @Month
               AND YEAR(EntryDate) = @Year), 0)         AS TotalHours,
        ISNULL(c.HourlyRate, 0)                         AS HourlyRate,
        ISNULL(c.FixedAmount, 0)                        AS FixedAmount,
        ISNULL(
            (SELECT SUM(Hours) FROM dbo.TimesheetEntries
             WHERE CandidateId = u.UserId
               AND MONTH(EntryDate) = @Month
               AND YEAR(EntryDate) = @Year), 0)
            * ISNULL(c.HourlyRate, 0)
            + ISNULL(c.FixedAmount, 0)                  AS TotalAmount
    FROM dbo.Users u
    JOIN dbo.Candidates c ON c.UserId = u.UserId
    JOIN dbo.CandidateProjectMapping cpm ON cpm.CandidateId = u.UserId AND cpm.IsActive = 1
    JOIN dbo.Projects p ON p.ProjectId = cpm.ProjectId
    LEFT JOIN dbo.TimesheetEntries te
        ON  te.CandidateId = u.UserId
        AND te.ProjectId   = p.ProjectId
        AND MONTH(te.EntryDate) = @Month
        AND YEAR(te.EntryDate)  = @Year
    WHERE u.IsActive = 1 AND u.Role = 'candidate'
      AND (@CandidateId IS NULL OR u.UserId = @CandidateId)
    GROUP BY u.UserId, u.FullName, u.Email, p.ProjectId, p.Name,
             c.HourlyRate, c.FixedAmount
    ORDER BY u.FullName, p.Name;
END
GO

-- ----------------------------------------------------------------
-- 13. GetAllCandidates  (admin listing)
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetAllCandidates
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.UserId        AS user_id,
        u.Email         AS email,
        u.FullName      AS full_name,
        c.Phone         AS phone,
        c.HourlyRate    AS hourly_rate,
        c.FixedAmount   AS fixed_amount,
        c.AccountNo     AS account_no,
        c.IFSCCode      AS ifsc_code,
        u.IsActive      AS is_active,
        u.CreatedDate   AS created_date
    FROM dbo.Users u
    JOIN dbo.Candidates c ON c.UserId = u.UserId
    WHERE u.Role = 'candidate'
    ORDER BY u.FullName;
END
GO

-- ----------------------------------------------------------------
-- 14. SetCandidateStatus
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.SetCandidateStatus
    @UserId   INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users
    SET IsActive    = @IsActive,
        UpdatedDate = SYSUTCDATETIME()
    WHERE UserId = @UserId;
    SELECT 1 AS Success;
END
GO

-- ----------------------------------------------------------------
-- 15. GetAllProjects
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetAllProjects
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ProjectId       AS project_id,
        Name            AS name,
        Description     AS description,
        IsActive        AS is_active,
        CreatedDate     AS created_date
    FROM dbo.Projects
    ORDER BY Name;
END
GO

-- ----------------------------------------------------------------
-- 16. GetAssignedProjects  (for a candidate's timesheet)
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.GetAssignedProjects
    @CandidateId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.ProjectId     AS project_id,
        p.Name          AS name,
        p.Description   AS description,
        p.IsActive      AS is_active,
        p.CreatedDate   AS created_date
    FROM dbo.CandidateProjectMapping cpm
    JOIN dbo.Projects p ON p.ProjectId = cpm.ProjectId
    WHERE cpm.CandidateId = @CandidateId
      AND cpm.IsActive    = 1
      AND p.IsActive      = 1
    ORDER BY p.Name;
END
GO

-- ----------------------------------------------------------------
-- 17. UpdateCandidateRates
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.UpdateCandidateRates
    @UserId      INT,
    @HourlyRate  DECIMAL(10,2) = NULL,
    @FixedAmount DECIMAL(10,2) = NULL,
    @Phone       NVARCHAR(30)  = NULL,
    @AccountNo   NVARCHAR(30)  = NULL,
    @IFSCCode    NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Candidates
    SET
        HourlyRate  = ISNULL(@HourlyRate,  HourlyRate),
        FixedAmount = ISNULL(@FixedAmount, FixedAmount),
        Phone       = ISNULL(@Phone,       Phone),
        AccountNo   = ISNULL(@AccountNo,   AccountNo),
        IFSCCode    = ISNULL(@IFSCCode,    IFSCCode),
        UpdatedDate = SYSUTCDATETIME()
    WHERE UserId = @UserId;

    SELECT
        u.UserId        AS user_id,
        u.Email         AS email,
        u.FullName      AS full_name,
        c.Phone         AS phone,
        c.HourlyRate    AS hourly_rate,
        c.FixedAmount   AS fixed_amount,
        c.AccountNo     AS account_no,
        c.IFSCCode      AS ifsc_code,
        u.IsActive      AS is_active,
        u.CreatedDate   AS created_date
    FROM dbo.Users u
    JOIN dbo.Candidates c ON c.UserId = u.UserId
    WHERE u.UserId = @UserId;
END
GO

-- ----------------------------------------------------------------
-- 18. UpdateTimesheetEntry
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.UpdateTimesheetEntry
    @EntryId INT,
    @Hours   DECIMAL(5,2),
    @Remarks NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.TimesheetEntries
    SET
        Hours       = @Hours,
        Remarks     = @Remarks,
        UpdatedDate = SYSUTCDATETIME()
    WHERE EntryId = @EntryId;

    SELECT
        te.EntryId,
        te.ProjectId,
        p.Name    AS ProjectName,
        te.EntryDate,
        te.Hours,
        te.Remarks
    FROM dbo.TimesheetEntries te
    JOIN dbo.Projects p ON p.ProjectId = te.ProjectId
    WHERE te.EntryId = @EntryId;
END
GO

-- ----------------------------------------------------------------
-- 19. DeleteTimesheetEntry
-- ----------------------------------------------------------------
CREATE PROCEDURE dbo.DeleteTimesheetEntry
    @EntryId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.TimesheetEntries WHERE EntryId = @EntryId;
    SELECT 1 AS Success;
END
GO

-- =================================================================
-- SAMPLE DATA
-- =================================================================

-- Clear existing sample data (safe re-run)
DELETE FROM dbo.TimesheetEntries WHERE CandidateId IN (SELECT UserId FROM dbo.Users WHERE Email LIKE '%@efforttracker.dev');
DELETE FROM dbo.CandidateProjectMapping WHERE CandidateId IN (SELECT UserId FROM dbo.Users WHERE Email LIKE '%@efforttracker.dev');
DELETE FROM dbo.Candidates WHERE UserId IN (SELECT UserId FROM dbo.Users WHERE Email LIKE '%@efforttracker.dev');
DELETE FROM dbo.Projects WHERE Name IN ('Alpha Platform', 'Beta Analytics', 'Gamma Mobile');
DELETE FROM dbo.Users WHERE Email LIKE '%@efforttracker.dev';
GO

-- Admin users
-- Password: Admin@123 (bcrypt hash — replace with real hash generated by the app)
INSERT INTO dbo.Users (Email, PasswordHash, FullName, Role)
VALUES
    ('admin@efforttracker.dev',  '$2b$12$placeholder.admin1.hash.replace.this.with.real.bcrypt', 'System Admin',   'admin'),
    ('manager@efforttracker.dev','$2b$12$placeholder.admin2.hash.replace.this.with.real.bcrypt', 'Project Manager','admin');

-- Candidate users
-- Password: Candidate@123
INSERT INTO dbo.Users (Email, PasswordHash, FullName, Role)
VALUES
    ('alice@efforttracker.dev',  '$2b$12$placeholder.alice.hash.replace.this.with.real.bcrypt', 'Alice Johnson', 'candidate'),
    ('bob@efforttracker.dev',    '$2b$12$placeholder.bob.hash.replace.this.with.real.bcrypt',   'Bob Smith',     'candidate'),
    ('carol@efforttracker.dev',  '$2b$12$placeholder.carol.hash.replace.this.with.real.bcrypt', 'Carol Williams','candidate');

-- Candidate profiles
INSERT INTO dbo.Candidates (UserId, Phone, HourlyRate, FixedAmount)
SELECT UserId, '+1-555-0101', 50.00, 0.00   FROM dbo.Users WHERE Email = 'alice@efforttracker.dev'
UNION ALL
SELECT UserId, '+1-555-0102', 45.00, 500.00 FROM dbo.Users WHERE Email = 'bob@efforttracker.dev'
UNION ALL
SELECT UserId, '+1-555-0103', 0.00,  2000.00 FROM dbo.Users WHERE Email = 'carol@efforttracker.dev';

-- Projects
INSERT INTO dbo.Projects (Name, Description)
VALUES
    ('Alpha Platform',  'Core platform development'),
    ('Beta Analytics',  'Business intelligence and reporting'),
    ('Gamma Mobile',    'Mobile application development');

-- Assignments
DECLARE @Alice  INT = (SELECT UserId FROM dbo.Users WHERE Email = 'alice@efforttracker.dev');
DECLARE @Bob    INT = (SELECT UserId FROM dbo.Users WHERE Email = 'bob@efforttracker.dev');
DECLARE @Carol  INT = (SELECT UserId FROM dbo.Users WHERE Email = 'carol@efforttracker.dev');
DECLARE @PAlpha INT = (SELECT ProjectId FROM dbo.Projects WHERE Name = 'Alpha Platform');
DECLARE @PBeta  INT = (SELECT ProjectId FROM dbo.Projects WHERE Name = 'Beta Analytics');
DECLARE @PGamma INT = (SELECT ProjectId FROM dbo.Projects WHERE Name = 'Gamma Mobile');

INSERT INTO dbo.CandidateProjectMapping (CandidateId, ProjectId) VALUES
    (@Alice, @PAlpha), (@Alice, @PBeta),
    (@Bob,   @PAlpha), (@Bob,   @PGamma),
    (@Carol, @PBeta),  (@Carol, @PGamma);

-- Sample timesheet entries (current month)
DECLARE @ThisYear  SMALLINT = YEAR(GETUTCDATE());
DECLARE @ThisMonth TINYINT  = MONTH(GETUTCDATE());

INSERT INTO dbo.TimesheetEntries (CandidateId, ProjectId, EntryDate, Hours, Remarks)
VALUES
    (@Alice, @PAlpha, DATEFROMPARTS(@ThisYear, @ThisMonth, 1),  4.0, 'Sprint planning'),
    (@Alice, @PBeta,  DATEFROMPARTS(@ThisYear, @ThisMonth, 1),  3.5, 'Dashboard review'),
    (@Alice, @PAlpha, DATEFROMPARTS(@ThisYear, @ThisMonth, 2),  6.0, 'Feature development'),
    (@Alice, @PBeta,  DATEFROMPARTS(@ThisYear, @ThisMonth, 3),  5.0, 'Report generation'),
    (@Bob,   @PAlpha, DATEFROMPARTS(@ThisYear, @ThisMonth, 1),  5.0, 'API development'),
    (@Bob,   @PGamma, DATEFROMPARTS(@ThisYear, @ThisMonth, 2),  4.0, 'iOS screens'),
    (@Bob,   @PAlpha, DATEFROMPARTS(@ThisYear, @ThisMonth, 3),  7.0, 'Code review'),
    (@Carol, @PBeta,  DATEFROMPARTS(@ThisYear, @ThisMonth, 1),  8.0, 'Data modelling'),
    (@Carol, @PGamma, DATEFROMPARTS(@ThisYear, @ThisMonth, 2),  6.0, 'UI components');

PRINT 'Schema and sample data loaded successfully.';
PRINT '';
PRINT 'IMPORTANT: The PasswordHash values in sample data are placeholders.';
PRINT 'Run the seed_admin.py helper script to generate real bcrypt hashes.';
GO
