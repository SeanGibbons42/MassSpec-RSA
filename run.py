import data
from model import AppModel

import json
import os
import pandas as pd

from natsort import natsorted

import webbrowser
from threading import Timer

from flask import Flask, Response, request, render_template, jsonify, send_from_directory, send_file
from werkzeug import secure_filename

app = Flask(__name__)
app.debug = True

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLD_NAME = "uploads"
OUTPUT_FOLD_NAME = "output"
app.config['UPLOAD_FOLDER'] = os.path.join(APP_ROOT, UPLOAD_FOLD_NAME)
app.config['OUTPUT_FOLDER'] = os.path.join(APP_ROOT, OUTPUT_FOLD_NAME)

#appmodel will keep track of application state.
appmodel = AppModel()

# pop open your favorite browser when the app is run.
def open_browser():
    webbrowser.open_new('http://localhost:5000/')

Timer(1, open_browser).start();


def open_file(filename):
    #if the file is the same, all clear
    if filename == appmodel.open_file_name:
        file = appmodel.open_file

    #if not load the requested file and save it to application state
    else:
        path = os.path.join(app.config["UPLOAD_FOLDER"], appmodel.datafolder, filename)
        file = data.read_extrel(path)
        appmodel.open_file = file
        appmodel.open_file_name = filename

    return file

def save_output(data):
    files = sorted(list(data.keys()))
    amus  = sorted(list(data[files[0]].keys()))

    intData = pd.DataFrame(columns=amus, index=files)
    sigData = pd.DataFrame(columns=amus, index=files)
    for file in files:
        for amu in amus:
            intData[amu][file] = data[file][amu]['integral']
            sigData[amu][file] = data[file][amu]['signal']

    filename = appmodel.datafolder + ".xlsx"
    savepath = os.path.join(APP_ROOT, "output", filename)

    writer = pd.ExcelWriter(savepath, engine='xlsxwriter')
    intData.to_excel(writer, sheet_name="Integral")
    sigData.to_excel(writer, sheet_name="Signal")
    writer.save()

#Page routes
@app.route("/", methods=["GET"])
def upload_page():
    """ return homepage [file upload] """
    return render_template("upload.html")

@app.route("/explore", methods=["GET"])
def explore_page():
    """ returns the exploratory analysis page """
    path = os.path.join(app.config["UPLOAD_FOLDER"], appmodel.datafolder)
    if path:
        filelist = natsorted(os.listdir(path))
    else:
        filelist = []
    return render_template("explore.html", filelist = filelist)

@app.route("/analyze", methods=["GET"])
def analyze_page():
    """ returns the analysis and results page """
    return render_template("analyze.html")


#AJAX API Routes - Actions
@app.route("/folder-list", methods=["GET"])
def filelist():
    """ returns a list of files in the target folder. """
    folder = request.args["folder"]
    path = os.path.join(app.config["UPLOAD_FOLDER"], folder)

    try:
        files = natsorted(os.listdir(path))

        return Response(json.dumps(files), mimetype="application/json")
    except FileNotFoundError:
        return Response("FileNotFoundError", status=404)

@app.route("/file-list", methods=["GET"])
def folderlist():
    """ returns a list of folders in the upload folder """
    path = app.config["UPLOAD_FOLDER"]
    return Response(json.dumps(os.listdir(path)), mimetype="application/json")

@app.route("/set-folder", methods=["GET", "POST"])
def activefolder():
    """ gets and sets the active folder - for graphing and analysis """
    if request.method == "GET":
        return jsonify({'folder': appmodel.datafolder})

    if request.method == "POST":
        print("setting folder = ", request.form["folder"])
        folder = request.form["folder"]
        appmodel.datafolder = folder
        return Response("success", status=200)

@app.route("/upload", methods=["GET", "POST"])
def upload_folder():
    """ upload a folder and all its files. """
    if request.method == "POST":
        #get filename, folder name, and
        file = request.files['file']
        foldername = request.form['folder']
        filename = request.form['name']

        #create a new folder if the requested folder doesnt exist
        savepath = os.path.join(app.config['UPLOAD_FOLDER'], foldername)
        if not os.path.exists(savepath):
            os.mkdir(savepath)

        #save the file to the requested folder
        file.save(os.path.join(savepath, secure_filename(filename)))
        return Response("saved", status=200)

@app.route("/folder-delete", methods=["POST"])
def delfolder():
    """ deletes a requested folder from the data store. """
    folder = request.form["folder"]
    path = os.path.join(app.config["UPLOAD_FOLDER"], folder)
    if not os.path.exists(path):
        return Response("directory not found", status=404)

    files = os.listdir(path)
    for file in files:
        os.remove(os.path.join(path, file))
    os.rmdir(path)

    return Response("success", status=200)

@app.route("/run", methods=["GET", "POST"])
def analysis():
    if request.method == "GET":
        return Response(json.dumps(appmodel.results), mimetype="application/json")

    if request.method == "POST":
        foldername = appmodel.datafolder

        inpath  = os.path.join(app.config["UPLOAD_FOLDER"], foldername)
        outpath = app.config["OUTPUT_FOLDER"]
        outfile = os.path.join(outpath, foldername+".csv")

        #convert amu's to ints
        amus = appmodel.amus
        for i in range(len(amus)):
            amus[i] = int(amus[i])

        bgstart = int(request.form["bgstart"])
        bgend = int(request.form["bgend"])
        avgstart = int(request.form["avgstart"])
        avgend = int(request.form["avgend"])
        ibeam  = float(request.form["beamcurrent"])
        texp   = float(request.form["exptime"])

        results, files = data.analyze(inpath, bgstart, bgend, avgstart, avgend, texp, ibeam, amus)
        appmodel.results = results
        save_output(results)
        return Response(json.dumps({"data": results, "files":files}), mimetype="application/json")

@app.route("/svg2png", methods=["GET"])
def save_svg():
    """ receive the svg xml code for the graph, convert to PNG and send it back. """
    svgtemppath = os.path.join(APP_ROOT, "output", "request.svg")
    pngtemppath = os.path.join(APP_ROOT, "output", "request.png")

    svg = request.args["svg"]

    with open(svgtemppath, "w") as file:
        file.write(svg)

    drawing = svg2rlg(svgtemppath)
    renderPM.drawToFile(drawing, pngtemppath, fmt="PNG")

    return send_file(pngtemppath, attachment_filename="mass-spec.png")

#AJAX API routes - application state read/write
@app.route("/data", methods=["GET"])
def get_inten_data():
    """ Handles request for amu data [primarily for graphing], for a given file """
    #get file information
    folder = appmodel.transfolder if appmodel.transfolder else appmodel.infolder
    file = request["filename"]
    ext = file.split('.')[-1]
    path = folder+"/"+file

    #decide which parser to use based on the file extention
    parser = data.read_extrel if ext==".txt" else data.read_msd

    #extract data
    amu_data = {}
    ms_data = parser(path)
    for amu in request["amus"]:
        amu_data[amu] = ms_data["amu"]

    return jsonify(amu_data)


@app.route("/amu", methods=["GET","POST"])
def update_amus():
    """ The user can select a list of AMUs. Maintain a list of selected amus
    so that if the user changes pages they can keep their list. """
    if request.method =="GET":
        return jsonify(appmodel.amus)

    elif request.method == "POST":
        op = request.form["operation"]
        value = request.form["amu"]
        if op == "add":
            if not value in appmodel.amus:
                appmodel.amus.append(int(value))

        elif op == "delete":
            print("DELETE")
            value = int(value)
            if value in appmodel.amus:
                i = appmodel.amus.index(value)
                del appmodel.amus[i]

        return Response("success", status=200)

@app.route("/scan_range", methods = ["GET"])
def scan_range():
    print(request.args)
    fname = request.args["file"]
    file = open_file(fname)
    scans = file.columns.tolist()

    return jsonify({"min": min(scans), "max": max(scans)})

@app.route("/amu_range", methods = ["GET"])
def amu_range():
    fname = request.args["file"]
    file = open_file(fname)
    amulist = file.index.tolist()

    return jsonify({"min": min(amulist), "max": max(amulist)})

@app.route("/settings", methods=["GET", "POST"])
def analysis_settings():
    if request.method=="GET":
        return jsonify(appmodel.analysis_params)

    elif request.method=="POST":
        params = request.form
        try:
            for param_name in params.keys():
                appmodel[param] = param
            return Response("success", status=200)

        except KeyError:
            return Response("error - setting not found - operation aborted", status=404)

@app.route("/inten", methods=["GET"])
def intensities():
    """ given a file path and amu value, fetch the intensities for that amu """
    filename = request.args["file"]
    amu = int(request.args["amu"])
    file = open_file(filename)

    return jsonify({"amus":file.loc[amu].tolist(), "scans":file.columns.tolist()})

@app.route("/scan-inten", methods=["GET"])
def scan_intensities():
    """ Given a scan #, return intesity vs AMU """
    filename = request.args["file"]
    scan = int(request.args["scan"])
    file = open_file(filename)

    return jsonify({"intensities": file[scan].tolist(), "amulist": file.index.tolist()})



@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                          'favicon.ico',mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run()
