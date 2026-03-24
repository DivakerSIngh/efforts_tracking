-- =================================================================
-- Migration: Update SPs to support AccountNo/IFSCCode and @CandidateId filter
-- Run against Efforts_Tracking database
-- =================================================================

USE Efforts_Tracking;
GO

-- Drop and recreate affected SPs
DROP PROCEDURE IF EXISTS dbo.CreateUser;
DROP PROCEDURE IF EXISTS dbo.GetAllCandidates;
DROP PROCEDURE IF EXISTS dbo.UpdateCandidateRates;
DROP PROCEDURE IF EXISTS dbo.GetAllCandidatesReport;
GO

-- ----------------------------------------------------------------
-- CreateUser (with AccountNo and IFSCCode)
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
-- GetAllCandidates (returns AccountNo and IFSCCode)
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
-- UpdateCandidateRates (with AccountNo and IFSCCode)
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
-- GetAllCandidatesReport (with optional @CandidateId filter)
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

PRINT 'Migration complete: SPs updated successfully.';
