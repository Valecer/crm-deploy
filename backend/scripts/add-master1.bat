@echo off
cd /d "%~dp0\.."
node scripts/add-master-account.js master1 "master 123"
pause

