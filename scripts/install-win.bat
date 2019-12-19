@echo off

cd ..
mkdir uploads
mkdir output

python -m venv venv
CALL venv\Scripts\activate.bat

pip install --upgrade pip
pip install -r requirements.txt

:END
