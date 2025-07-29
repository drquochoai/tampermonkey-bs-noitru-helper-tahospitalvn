@echo off
echo ==========================================
echo     AUTO MERGE TO HOAI-MULTIPLER
echo ==========================================
echo.

:: Get current branch name
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%
echo.

:: Check if working directory is clean
git status --porcelain > nul
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set dirty_count=%%i
if %dirty_count% gtr 0 (
    echo ERROR: Working directory is not clean!
    echo Please commit or stash your changes first.
    echo.
    echo Uncommitted changes:
    git status --porcelain
    pause
    exit /b 1
)

echo Working directory is clean. Proceeding with merge...
echo.

:: Switch to hoai-multipler branch
echo Step 1: Switching to hoai-multipler branch...
git checkout hoai-multipler
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to switch to hoai-multipler branch!
    pause
    exit /b 1
)
echo ✓ Successfully switched to hoai-multipler
echo.

:: Pull latest changes from remote
echo Step 2: Pulling latest changes from remote...
git pull hoai hoai-multipler
if %ERRORLEVEL% neq 0 (
    echo WARNING: Failed to pull from remote, continuing anyway...
)
echo ✓ Pull completed
echo.

:: Merge current branch into hoai-multipler
echo Step 3: Merging %CURRENT_BRANCH% into hoai-multipler...
git merge %CURRENT_BRANCH%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Merge failed! Please resolve conflicts manually.
    echo.
    echo To resolve conflicts:
    echo 1. Fix conflicts in the files
    echo 2. Run: git add .
    echo 3. Run: git commit
    echo 4. Run: git push hoai hoai-multipler
    pause
    exit /b 1
)
echo ✓ Merge completed successfully
echo.

:: Push changes to remote
echo Step 4: Pushing changes to remote...
git push hoai hoai-multipler
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to push to remote!
    pause
    exit /b 1
)
echo ✓ Push completed successfully
echo.

:: Show summary
echo ==========================================
echo           MERGE SUMMARY
echo ==========================================
echo ✓ Merged %CURRENT_BRANCH% into hoai-multipler
echo ✓ Pushed changes to remote repository
echo.
echo Recent commits:
git log --oneline -5
echo.

:: Ask if user wants to switch back to original branch
echo.
set /p SWITCH_BACK="Do you want to switch back to %CURRENT_BRANCH%? (y/n): "
if /i "%SWITCH_BACK%"=="y" (
    git checkout %CURRENT_BRANCH%
    echo ✓ Switched back to %CURRENT_BRANCH%
) else (
    echo Staying on hoai-multipler branch
)

echo.
echo ==========================================
echo     MERGE PROCESS COMPLETED!
echo ==========================================
pause
