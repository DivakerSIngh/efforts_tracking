-- =================================================================
-- Migration: Encrypt HourlyRate and FixedAmount at rest
-- All encryption/decryption is handled by the Python application layer.
-- The database stores Fernet ciphertext as NVARCHAR(500).
--
-- Run against: Efforts_Tracking database
-- IMPORTANT: Run this ONCE. After running, the Python app must be
--            deployed with the FIELD_ENCRYPTION_KEY set in .env.
-- =================================================================

USE Efforts_Tracking;
GO

-- -----------------------------------------------------------------
-- 1. Convert column types: DECIMAL -> NVARCHAR(500)
--    Existing plain decimal values (e.g. '50.00') are preserved as
--    plain strings; the Python decrypt_decimal() falls back to
--    float() for unencrypted legacy rows.
-- -----------------------------------------------------------------

-- Drop existing DEFAULT constraints first (required before ALTER COLUMN)
ALTER TABLE dbo.Candidates DROP CONSTRAINT DF_Cand_HourlyRate;
GO
ALTER TABLE dbo.Candidates DROP CONSTRAINT DF_Cand_FixedAmount;
GO

-- Convert numeric values to strings before changing type
ALTER TABLE dbo.Candidates ALTER COLUMN HourlyRate NVARCHAR(500) NOT NULL;
GO
ALTER TABLE dbo.Candidates ALTER COLUMN FixedAmount NVARCHAR(500) NOT NULL;
GO

-- Restore DEFAULT constraints (plain '0' for new rows before Python encrypts)
ALTER TABLE dbo.Candidates ADD CONSTRAINT DF_Cand_HourlyRate  DEFAULT '0' FOR HourlyRate;
GO
ALTER TABLE dbo.Candidates ADD CONSTRAINT DF_Cand_FixedAmount DEFAULT '0' FOR FixedAmount;
GO

-- -----------------------------------------------------------------
-- 2. Recreate CreateUser SP — accept encrypted strings
-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS dbo.CreateUser;
GO
CREATE PROCEDURE dbo.CreateUser
    @Email        NVARCHAR(255),
    @PasswordHash NVARCHAR(512),
    @FullName     NVARCHAR(200),
    @Role         NVARCHAR(20)   = 'candidate',
    @Phone        NVARCHAR(30)   = NULL,
    @HourlyRate   NVARCHAR(500)  = '0',
    @FixedAmount  NVARCHAR(500)  = '0',
    @AccountNo    NVARCHAR(30)   = NULL,
    @IFSCCode     NVARCHAR(20)   = NULL
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

-- -----------------------------------------------------------------
-- 3. Recreate UpdateCandidateRates SP — accept encrypted strings
-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS dbo.UpdateCandidateRates;
GO
CREATE PROCEDURE dbo.UpdateCandidateRates
    @UserId      INT,
    @HourlyRate  NVARCHAR(500) = NULL,
    @FixedAmount NVARCHAR(500) = NULL,
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

-- -----------------------------------------------------------------
-- 4. Recreate GetCandidateMonthlyReport SP
--    HourlyRate/FixedAmount returned as encrypted strings.
--    TotalPayment calculation is removed — Python computes it after
--    decrypting the rate fields.
-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS dbo.GetCandidateMonthlyReport;
GO
CREATE PROCEDURE dbo.GetCandidateMonthlyReport
    @CandidateId INT,
    @Month       TINYINT,
    @Year        SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalHours  DECIMAL(8,2);
    DECLARE @HourlyRate  NVARCHAR(500);
    DECLARE @FixedAmount NVARCHAR(500);
    DECLARE @FullName    NVARCHAR(200);

    SELECT
        @TotalHours = ISNULL(SUM(te.Hours), 0)
    FROM dbo.TimesheetEntries te
    WHERE te.CandidateId = @CandidateId
      AND MONTH(te.EntryDate) = @Month
      AND YEAR(te.EntryDate)  = @Year;

    SELECT
        @HourlyRate  = c.HourlyRate,
        @FixedAmount = c.FixedAmount,
        @FullName    = u.FullName
    FROM dbo.Candidates c
    JOIN dbo.Users u ON u.UserId = c.UserId
    WHERE c.UserId = @CandidateId;

    -- TotalPayment is intentionally 0 here; Python decrypts rates and computes it.
    SELECT
        p.ProjectId,
        p.Name                                  AS ProjectName,
        ISNULL(SUM(te.Hours), 0)                AS ProjectHours,
        @TotalHours                             AS TotalHours,
        @HourlyRate                             AS HourlyRate,
        @FixedAmount                            AS FixedAmount,
        0                                       AS TotalPayment,
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

-- -----------------------------------------------------------------
-- 5. Recreate GetAllCandidatesReport SP
--    HourlyRate/FixedAmount returned as encrypted strings.
--    TotalAmount removed — Python computes it after decryption.
-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS dbo.GetAllCandidatesReport;
GO
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
        c.HourlyRate                                    AS HourlyRate,
        c.FixedAmount                                   AS FixedAmount
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

-- -----------------------------------------------------------------
-- 6. Recreate GetAdminProjectReport SP
--    Amount calculations removed — Python (get_admin_project_report)
--    aggregates totals after decrypting candidate rates.
-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS dbo.GetAdminProjectReport;
GO
CREATE PROCEDURE dbo.GetAdminProjectReport
    @Month TINYINT,
    @Year  SMALLINT
AS
BEGIN
    SET NOCOUNT ON;
    -- NOTE: This SP is no longer called by the application.
    -- Amount aggregation is performed in Python after decrypting rates.
    -- Kept for reference / direct DB queries.
    SELECT
        p.ProjectId,
        p.Name                                          AS ProjectName,
        COUNT(DISTINCT te.CandidateId)                  AS TotalCandidates,
        ISNULL(SUM(te.Hours), 0)                        AS TotalHours,
        0                                               AS CandidateAmount,
        0                                               AS ProjectAmount
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

PRINT 'Encryption migration complete.';
PRINT 'HourlyRate and FixedAmount columns are now NVARCHAR(500).';
PRINT 'Existing plain decimal values are preserved; Python decrypt_decimal() falls back to float() for them.';
PRINT 'Deploy the updated Python application with FIELD_ENCRYPTION_KEY set in .env before running the app.';
GO
