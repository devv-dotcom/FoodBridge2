@echo off
title Food Rescue - Git Push
set GIT_SSH=C:\Windows\System32\OpenSSH\ssh.exe
set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;C:\Program Files\Git\mingw64\bin

echo ========================================
echo   Food Rescue - Push to GitHub
echo ========================================
echo.

:: Ask for commit message
set /p msg="Enter commit message (or press Enter for 'update'): "
if "%msg%"=="" set msg=update

git add .
git commit -m "%msg%"
git push

echo.
echo ========================================
if %errorlevel%==0 (
    echo   SUCCESS! Pushed to GitHub
    echo   https://github.com/devv-dotcom/FoodBridge2
) else (
    echo   Push failed. Check error above.
)
echo ========================================
pause
