@echo off

cd ..
mkdir uploads
mkdir output

python -m venv venv
CALL venv\Scripts\activate.bat

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

:END
