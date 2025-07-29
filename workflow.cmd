@echo off
echo ==========================================
echo    COMPLETE WORKFLOW AUTOMATION
echo ==========================================
echo.

:: Get current branch name
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%
echo.

:: Menu
echo Select an option:
echo 1. Build and Copy only
echo 2. Merge to hoai-multipler only  
echo 3. Build + Merge (Complete workflow)
echo 4. Exit
echo.
set /p CHOICE="Enter your choice (1-4): "

if "%CHOICE%"=="1" goto BUILD_ONLY
if "%CHOICE%"=="2" goto MERGE_ONLY
if "%CHOICE%"=="3" goto COMPLETE_WORKFLOW
if "%CHOICE%"=="4" goto EXIT
echo Invalid choice! Please try again.
pause
goto START

:BUILD_ONLY
echo.
echo ==========================================
echo         BUILDING PROJECT
echo ==========================================
call quick-build.cmd
goto END

:MERGE_ONLY
echo.
echo ==========================================
echo         MERGING TO HOAI-MULTIPLER
echo ==========================================
call auto-merge-to-multipler.cmd
goto END

:COMPLETE_WORKFLOW
echo.
echo ==========================================
echo      COMPLETE WORKFLOW STARTED
echo ==========================================
echo.

:: Step 1: Build
echo Step 1/2: Building project...
npm run build-and-copy
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✓ Build completed successfully
echo.

:: Step 2: Commit changes (if any)
git status --porcelain > temp_status.txt
for %%A in (temp_status.txt) do set size=%%~zA
if %size% gtr 0 (
    echo Changes detected. Committing changes...
    git add .
    git commit -m "Build update - auto commit"
    echo ✓ Changes committed
) else (
    echo No changes to commit
)
del temp_status.txt
echo.

:: Step 3: Merge
echo Step 2/2: Merging to hoai-multipler...
call auto-merge-to-multipler.cmd
goto END

:EXIT
echo Goodbye!
exit /b 0

:END
echo.
echo ==========================================
echo       WORKFLOW COMPLETED!
echo ==========================================
pause

:START
