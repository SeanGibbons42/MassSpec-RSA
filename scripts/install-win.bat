@echo off

cd ..
mkdir uploads
mkdir output

python34 -m venv
CALL venv\Scripts\activate.bat

python34 -m pip install --upgrade pip
python34 -m pip install -r requirements.txt

:END
