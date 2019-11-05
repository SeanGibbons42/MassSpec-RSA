class AppModel():
    """ class AppModel is used to store global app context. """
    def __init__(self):
        self.datafolder = ""
        self.outputfolder = ""
        self.analysis_params = {
            "bg_start":0,
            "bg_end":75,
            "beam_current":0.1,
            "exposure_time":2,
        }

        self.amus = []
        self.open_file_name = ""
        self.open_file = None

        self.results = None
