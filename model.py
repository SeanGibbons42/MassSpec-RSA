class AppModel():
    """ class AppModel is used to store global app context. """
    def __init__(self):
        self.datafolder = ""
        self.outputfolder = ""
        self.analysis_params = {
            "bg_start":0,
            "bg_end":75,
            "avg_start":100,
            "avg_end": 150,
            "beam_current":0.1,
            "exposure_time":2,
        }
        #list of currently selected AMU's
        self.amus = []
        #scan # range. format is [first, last]
        self.scanrange = []
        #name of currently open file
        self.open_file_name = ""
        #contents of currently opened file
        self.open_file = None
        #Results from last analysis run
        self.results = None
