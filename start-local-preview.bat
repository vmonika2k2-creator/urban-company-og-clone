@echo off
cd /d "%~dp0"
echo Starting the Urban Company preview...
echo Keep this window open while you use the app.
call npm.cmd run dev -- --host 127.0.0.1 --port 5173 --open
if errorlevel 1 pause
