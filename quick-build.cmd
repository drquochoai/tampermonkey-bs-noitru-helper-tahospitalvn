@echo off
echo ==========================================
echo       BUILD AND COPY SCRIPT
echo ==========================================
echo.

echo Building project...
npm run build-and-copy

if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ✓ Build and copy completed successfully!
echo ✓ Script has been copied to clipboard
echo.
echo ==========================================
echo      BUILD PROCESS COMPLETED!
echo ==========================================
pause
