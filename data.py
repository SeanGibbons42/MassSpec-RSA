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

    #we need to look at each scan on its own. Here we move the data for each scan into its own dataframe.
    scan_data = []
    for i in range(nscans):
        #index range of current scan
        start_i, end_i = scan_start[i]+1, scan_start[i+1]
        #save the data for the scan
        scan_amu = data["Masses"][start_i:end_i]
        scan_inten = data["Intensities"][start_i:end_i]
        scan = pd.DataFrame({"Masses": scan_amu, "Intensities": scan_inten})

        scan_data.append(scan)

    #get a list of integer masses from min to max
    amu_data = scan_data[1]["Masses"].astype('float64')
    amu_min, amu_max = int(min(amu_data)), int(max(amu_data))
    amu_data = list(range(amu_min, amu_max + 1))

    #create a dataframe for the consolidated scan data.
    #columns are scans and each row is atomic mass
    scan_table = pd.DataFrame({})
    scan_number = 1
    for scan in scan_data:
        #round the amu's for this scan_amu
        scan["Masses"] = scan["Masses"].astype("float64").round()
        scan["Intensities"] = scan["Intensities"].astype("float64")
        intensities = []
        for i in range(amu_min, amu_max + 1):
            #sum all intensities with at a given amu
            amu_intensities = scan["Intensities"][scan["Masses"]==i]
            intensities.append(sum(amu_intensities))
        scan_table[scan_number] = pd.Series(intensities)
        scan_number += 1
    scan_table.index=amu_data
    return scan_table

def analyze(dir, bg_start, bg_end, amu_list):
    exposures = load_all(dir)
    integral_dict = {}
    for amu in amu_list:
        integral_dict[amu] = []

    for filetable in exposures:
        inten_list = []
        for amu in amu_list:
            inten_list.append(filetable.loc[amu])

        bg_inten_list = bg_subtract_file(inten_list, bg_start, bg_end)
        integral_list = integrate_file(bg_inten_list)
        for i in range(len(amu_list)):
            integral_dict[amu].append(integral_list[i])
    return integral_list

def load_all(dir):
    """returns a list of data extracted from all exposure files. One element=one exposure"""
    fnames = os.listdir(dir)
    exposures=[]
    for fname in fnames:
        path = dir+"/"+fname
        table = read_extrel(path)
        exposures.append(table)
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
    # print("###########################")
    # print(bg_range)
    # print(type(bg_range))
    # bg_range = pd.Series(bg_range)
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

if __name__ == "__main__":
    testfile = "C:/Extrel/data/My Files/KA_OS4_S1dt8.txt"
    print(read_extrel(testfile))
