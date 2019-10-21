class AppModel():
    """ class AppModel is used to store global app context. """
    def __init__(self):
        self.datafolder = ""
        self.transfolder = ""
        self.outputfolder = ""
        self.analysis_params = {
            "bg_start":0,
            "bg_end":0,
            "beam_current":0,
            "exposure_time":0,
        }
