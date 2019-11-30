import numpy as np
import pandas as pd
import os


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

def read_msd(path):
    return pd.read_csv(path, index_col="index")

def analyze(dir, bgstart, bgend, exptime, beamcurrent, amulist):
    exposures = load_all(dir)
    filenames = os.listdir(dir)

    dataByFile = {}
    for file in filenames:
        dataByAmu = {}
        exposureData = exposures[file]

        for amu in amulist:
            amuData = exposureData.loc[amu]
            amuData = bg_subtract(amuData, bgstart, bgend)
            integral = integrate(amuData)
            nelectron = (beamcurrent*exptime)/1.602e-19
            signal = integral/nelectron
            average = integral/len(amuData)

            #data save data for this amu
            dataByAmu[amu] = {"integral": integral, "signal": signal, "average": average}
        dataByFile[file] = dataByAmu
    return dataByFile

def load_all(dir):
    """returns a list of data extracted from all exposure files. One element=one exposure"""
    fnames = os.listdir(dir)
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

def signal_strength(integral, dose):
    """ takes the total # of counts and exposure dose for a given mass and returns counts/electron """
    e_charge = 1.602e-19
    num_e = dose/e_charge
    return integral/num_e

def parse_test(testfile):
    from timeit import default_timer as timer
    start = timer()
    read_extrel(testfile)
    end = timer()
    return end-start
if __name__ == "__main__":
    """For testing"""
    testfile = "C:/Users/Owner/Documents/Work/Research/AnalysisTest/KA_OS4_S1dt8.txt"
    print(parse_test(testfile))
    print(read_extrel(testfile))
