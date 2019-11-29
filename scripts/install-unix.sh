cd ..
mkdir uploads
mkdir output

python3 -m venv
source venv\bin\activate

python3 -m pip3 install --upgrade pip
python3 -m pip3 install -r requirements.txt
