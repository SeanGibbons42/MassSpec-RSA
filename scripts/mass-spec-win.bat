@echo off

cd ..

CALL venv/Scripts/activate.bat

set FLASK_APP=run.py
flask run

@pause
