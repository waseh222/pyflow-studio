@echo off
cd /d "%~dp0"
echo PyFlow Studio available at http://localhost:8765/
echo Keep this window open while using the website.
start "" http://localhost:8765/
py -3 -m http.server 8765 2>nul || python -m http.server 8765
pause
