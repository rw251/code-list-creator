
--Varchar list table type
CREATE TYPE varchar_list_tbltype AS TABLE (n varchar(128) NOT NULL PRIMARY KEY)
GO


--Code validation stored procedure
-- =============================================
-- Author:		Richard Williams
-- Create date: 
-- Description:	
-- =============================================
ALTER PROCEDURE [dbo].[CodeValidation] 
	-- Add the parameters for the stored procedure here
	@text varchar(100) = 0,
	@codeExceptions varchar_list_tbltype READONLY,
	@textException1 varchar(100) = 'z#z#z#z#z#z',
	@textException2 varchar(100) = 'z#z#z#z#z#z',
	@textException3 varchar(100) = 'z#z#z#z#z#z',
	@textException4 varchar(100) = 'z#z#z#z#z#z'
AS
BEGIN
	IF OBJECT_ID('tempdb..#Codes') IS NOT NULL DROP TABLE #Codes;
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

    -- Insert statements for procedure here
	SELECT readcode INTO #Codes	FROM refRubric r
	INNER JOIN refReadcodeRubric rr on rr.rubricId = r.id
	INNER JOIN refReadcode re on re.id = rr.readcodeId
	WHERE lower(rubric) LIKE '%' + lower(@text) + '%' 
	AND lower(rubric) NOT LIKE '%' + lower(@textException1) + '%' 
	AND lower(rubric) NOT LIKE '%' + lower(@textException2) + '%' 
	AND lower(rubric) NOT LIKE '%' + lower(@textException3) + '%' 
	AND lower(rubric) NOT LIKE '%' + lower(@textException4) + '%' 
	AND readcode NOT IN (SELECT n FROM @codeExceptions)
	GROUP BY readcode;

	SELECT readcode as CodesFromSearch FROM #Codes;

	select sub.readcode as CodesNotUsed, rubric, rr.[count] from (
	SELECT readcode FROM #Codes
	EXCEPT
	SELECT Code FROM drugCodes) sub
	LEFT OUTER JOIN refReadcode r on r.readcode = sub.readcode
	LEFT OUTER JOIN refReadcodeRubric rr on rr.readcodeId = r.id
	LEFT OUTER JOIN refRubric ru on ru.id = rr.rubricId

END


--execute procedure
DECLARE @codeList varchar_list_tbltype
INSERT @codeList(n) VALUES('ALLERGY23931NEMIS'),('djif.'),('djig.'),('djih.')
EXEC	[dbo].[CodeValidation]
		@text = 'larapam',
		@codeExceptions = @codeList,
		@textException1 = 'larapamide'
		--,@textException2 = 'mandibular'
		--,@textException3 = 'vestibular'
		--,@textException4 = 'infundibular'
GO