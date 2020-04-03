import json
import numpy as np
import pandas as pd
import pandas.io.formats.excel
import os

from natsort import natsorted

def read_extrel(fname):
    """ Reads scan data from a csv file. Returns a pandas dataframe where:
            Each column is a scan
            Each row is mass (amu)
            values are the counts at each amu.
        Accepts absolute path to file.
    """
    #read the input file into a dataframe.
    data = pd.read_csv(fname, sep='\t', header=None)
    data = data.replace("-1.#INDe-2147483648", "0")
    data.columns = ["Masses", "Intensities"]

    #get starting index of each scan
    scan_start = data.index[data['Masses']=="Masses"].tolist()
    nscans = len(scan_start)

    #Append a header to the end of the dataframe
    scan_start.append(len(data.index))
    data = data.append({"Masses": "Masses", "Intensities": "Intensities"} , ignore_index=True)

    #get the Masses
    raw_amu = data["Masses"][1:scan_start[1]].astype("float64")
    scan_table_raw = pd.DataFrame(index=raw_amu)
    #we need to look at each scan on its own. Here we move the data for each scan into its own dataframe.
    scan_data = []
    for i in range(nscans):
        #index range of current scan
        start_i, end_i = scan_start[i]+1, scan_start[i+1]
        #save the data for the scan
        scan_inten = data["Intensities"][start_i:end_i].astype("float64").tolist()
        scan_table_raw[i] = scan_inten

    #get a list of integer masses from min to max
    amu_min, amu_max = int(min(scan_table_raw.index)), int(max(scan_table_raw.index))
    amu_data = list(range(amu_min, amu_max + 1))
    scan_table = pd.DataFrame(columns=range(nscans), index=amu_data)

    scan_table_raw.index = scan_table_raw.index.to_series().round()
    #create a dataframe for the consolidated scan data.
    #columns are scans and each row is atomic mass
    for i in range(amu_min, amu_max + 1):
        #sum all intensities with at a given amu
        s=scan_table_raw.loc[scan_table_raw.index==i].sum()
        scan_table.loc[i] = s
    return scan_table

def peek_file(dir, name):
    """ given a directory path and filename, peek_file will return the amu range and number of scans.
        This data is intended to be stored in a descriptor file that can be used for quick form validation.
     """
    fname = os.path.join(dir, name)
    data = pd.read_csv(fname, sep='\t', header=None)
    data.columns = ["Masses", "Intensities"]

    scanheaders = data.index[data["Masses"]=="Masses"]
    nscans = scanheaders.size
    scan1 = data["Masses"][scanheaders[0]+1:scanheaders[1]]
    amurange = int(float(scan1[1])), int(float(scan1[scan1.size]))

    return nscans, amurange

def folder_summary(dir):
    summary = {}
    val_bounds = {"nscans": float("inf"), "min_amu": 0, "max_amu": float("inf")}

    files = list_contents(dir)
    for file in files:
        nscans, amurange = peek_file(dir, file)
        summary[file] = {"nscans": nscans, "min_amu": amurange[0], "max_amu":amurange[1]}
        val_bounds["nscans"] = nscans if nscans < val_bounds["nscans"] else val_bounds["nscans"]
        val_bounds["min_amu"] = amurange[0] if amurange[0] > val_bounds["min_amu"] else val_bounds["min_amu"]
        val_bounds["max_amu"] = amurange[1] if amurange[1] < val_bounds["max_amu"] else val_bounds["max_amu"]

    summary["val_bounds"] = val_bounds

    outfile_path = os.path.join(dir, "summary.json")
    with open(outfile_path, 'w+') as outfile:
        json.dump(summary, outfile)

def list_contents(dir):
    """ wrapper on os.listdir, such that only txt files are returned """
    all_contents = os.listdir(dir)
    return [folder for folder in all_contents if folder.endswith(".txt")]


def analyze(dir, bgstart, bgend, avgstart, avgend, exptime, beamcurrent, amulist):
    exposures = load_all(dir)
    filenames = natsorted(list_contents(dir))

    dataByFile = {}
    for file in filenames:
        dataByAmu = {}
        exposureData = exposures[file]

        for amu in amulist:
            amuData = exposureData.loc[amu]
            amuData = bg_subtract(amuData, bgstart, bgend)

            integral = integrate(amuData)
            csum = np.cumsum(amuData[avgstart:avgend+1])
            #signal is integral/n electrons
            nelectron = (beamcurrent*1e-6*exptime)/1.602e-19
            signal = integral/nelectron
            #return the average of the cumulative sum
            average = csum.mean()

            #data save data for this amu
            dataByAmu[amu] = {"integral": integral, "signal": signal, "average": average}
        dataByFile[file] = dataByAmu
    return dataByFile, filenames

def write_excel(data, files, path):
    #initilize excel editor
    writer = pd.ExcelWriter(path, engine='xlsxwriter')
    pandas.io.formats.excel.ExcelFormatter.header_style=None

    workbook=writer.book
    worksheet=workbook.add_worksheet('Result')
    writer.sheets['Result'] = worksheet

    #information to track file position
    nfiles  = len(files)
    spacing = 2
    block   = 0
    amus = data[files[0]].keys()
    for amu in amus:
        amu_frame = pd.DataFrame(columns=["integral", "signal", "average"], index=files)
        for file in files:
            row = data[file][amu]
            amu_frame.loc[file] = row

        #write the block header [AMU value]
        y = block*(nfiles + spacing + 2)
        worksheet.write_string(y, 0, "AMU")
        worksheet.write_number(y, 1, amu)

        #write the data
        amu_frame.to_excel(writer, sheet_name='Result', startrow=y+1 , startcol=0)
        block+=1

    writer.save()

def load_all(dir):
    """returns a list of data extracted from all exposure files. One element=one exposure"""
    fnames = list_contents(dir)
    exposures={}
    for fname in fnames:
        path = dir+"/"+fname
        table = read_extrel(path)
        exposures[fname] = table
    return exposures

def bg_subtract_file(inten_list, bg_start, bg_end):
    """accepts a list where each element is a list of intensities at a given amu."""
    bg_inten_list= []
    for inten in inten_list:
        bg_inten_list.append(bg_subtract(inten, bg_start, bg_end))
    return bg_inten_list


def bg_subtract(inten, bg_start, bg_end):
    """ Takes in a Series of intensities, and the start/end of the background range.
        Subtracts background signal, and returns a series of background-subtracted intensities"""
    bg_range = inten[bg_start:bg_end+1]
    bg = bg_range.mean()
    return inten - bg

def integrate_file(inten_list):
    integral_list = []
    for inten in inten_list:
        int = integrate(inten)
        integral_list.append(int)
    return integral_list

def integrate(inten):
    """ Computes various quantities from the cleaned data. """
    #create an empty series
    inten = pd.Series(inten)
    return inten.sum()

def parse_test(testfile):
    from timeit import default_timer as timer
    start = timer()
    read_extrel(testfile)
    end = timer()
    return end-start

if __name__ == "__main__":
    """For testing"""
    testfile = "C:/Users/Owner/Documents/Work/Research/AnalysisTest/KA_OS4_S1dt8.txt"
    print(peek_file("C:/Users/Owner/Documents/Work/Research/AnalysisTest/", "KA_OS4_S1dt8.txt"))
    print(parse_test(testfile))
    # print(read_extrel(testfile))
