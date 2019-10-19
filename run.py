import os
from flask import Flask, render_template

app = Flask(__name__)
app.debug = True

@app.route("/", methods=["GET"])
def index():
    return render_template("upload.html")

if __name__ == '__main__':
    app.run()
