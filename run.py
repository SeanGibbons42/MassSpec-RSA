import os
import json
import pandas as pd
import data
from model import AppModel
from flask import Flask, Response, request, render_template, jsonify

app = Flask(__name__)
app.debug = True

#appmodel will keep track of application state.
appmodel = AppModel()

def validate_file(path, fname):
    #return true if the file is mass spec data generated by this program.
    if fname.split(".")[-1]=="msd":
        return True

    #else, check if the file can be read as a raw data file from extrel
    else:
        try:
            data.read_extrel(path+"/"+fname)
            return True
        except:
            return False

#Page routes
@app.route("/", methods=["GET"])
def upload_page():
    """ return homepage [file upload] """
    return render_template("upload.html")

@app.route("/explore", methods=["GET"])
def explore_page():
    """ returns the exploratory analysis page """
    return render_template("explore.html")

@app.route("/analyze", methods=["GET"])
def analyze_page():
    """ returns the analysis and results page """
    return render_template("analyze.html")


#AJAX Routes
@app.route("/upload-folder", methods=["GET"])
def upload():
    """ returns a list of file """
    path = request.args["path"]
    appmodel.datafolder = path
    try:
        return Response(json.dumps(os.listdir(path)), mimetype="application/json")
    except FileNotFoundError:
        return Response("FileNotFoundError", status=404)

@app.route("/transform", methods=["POST"])
def transform():
    inpath = request.form["inpath"]
    outpath = request.form["outpath"]
    appmodel.transfolder = outpath
    infiles = os.listdir(inpath)
    #convert all the data and re-save using the ms
    for infile in infiles:
        print(inpath+"/"+infile)
        exposure_data = data.read_extrel(inpath+"/"+infile)
        outfile = infile.replace(".txt", ".msd")
        exposure_data.to_csv(outpath+"/"+outfile, index_label="index")
    return Response("saved", status=200)

@app.route("/data", methods=["GET"])
def get_data():
    """ Handles request for amu data [primarily for graphing] """
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

@app.route("/run", methods=["POST"])
def run_analysis():
    outpath = request["outpath"]
    #convert amu's to ints
    amus = request["amus"]
    for i in range(len(amulist)):
        amus[i] = int(amus[i])

    bgstart, bgend = int(request["bgrange"][0]), int(request["bgrange"][1]),
    ibeam  = request["beamcurrent"]
    texp   = request["exposuretime"]

    results = analyze(inpath, bgstart, bgend, amus)

    return jsonify(list)

if __name__ == '__main__':
    app.run()
