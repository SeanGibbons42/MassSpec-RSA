# Mass Spec Data Studio
### About
During a recent lab project, my team needed to take repeated time-series measurements using a mass spectrometer. Each time-series consists of 100-200 individual spectra, and we needed to quickly analyze up to 50 time series for each of our experiments. We had scripts available to process individual time series, but ultimately using these to analyze 50+ series was very time consuming.

This app was developed to run batch analysis of our time-series data, allowing a ~2 hour process to be performed in less than 5 minutes. In addition, this app allows the user to visualize both time-series and individual mass spectra.

Aside from data viz, the software will calculate the time integral of any number of AMU values for each time series.

### Installation
Using command prompt or terminal, navigate to the directory in which you wish to install this software. Assuming you have github and python 3.5 or later installed, run the following command to pull the latest version of the code:

```
git clone https://github.com/SeanGibbons42/MassSpec-RSA.git
```

once downloaded, go to the scripts folder in the top-level directory in your file browser. Then run the script `install-win` if you are on windows or `install-unix` if you are on Mac/Linux.

Once installed, you can run the app using the script `mass-spec-win.bat` on windows or `mass-spec-unix.sh` on mac/linux to start the server. A command prompt/terminal should appear before you are redirected to your web browser. As long the server is running, you can always reach the app at by typing "localhost:5000" into your search bar.

Tip: For easy access save a shortcut to the run script to your desktop. Then all you have  to do is double-click the shortcut to get things going.

### Usage - File Management

When the app opens in your browser, you'll be brought to the file import tab:
![import.png](/docs/import.png)
Here you can use the table on the left to manage your data folders. To upload a folder containing Extrel output data, hit the upload button in the upper left. After some delay [the files are pretty big], the folder should be uploaded and appear in the list.

Once uploaded, select a folder for analysis using the select folder button in the action tab. The selected folder will be highlighted and its contents displayed on the left tab.

To delete a folder, just hit the red delete button.

### Usage - Time Series Visualization
![viz1.png](/docs/viz1.png)
Note: make sure to select a file in the import tab before using the visualization page!

The box on the left contains the visualization output. It will be blank at first, so go to the right box to specify which AMU values you want to see. Enter the value into the box at the bottom and hit the "+" button. The value should appear in the menu above, and data should now be visible in the plot output. In this panel, you can also select a file to visualize.

In the upper right of the visualization box, is a save button that lets you download the current chart as a PNG.

To switch to the mass spec viewer, use the dropdown in the upper left.

### Usage - Mass Spec Visualization
![viz2.png](/docs/viz2.png)
Switching to Mass Spec mode will let you view individual spectra. A settings button should now be in the upper right of the visualization box. Clicking it will bring up a popover with a slider and text box. Use the slider or enter a spectrum # in the text box, and hit the refresh button to view a specific spectrum.

### Usage - Analysis
![analysis.png](/docs/analysis.png)
To run the analysis, make sure you have the AMU values you want  selected in the explore tab. If not go back and enter them into the "AMU Select" box. Also, use the explore tab's data visualizations to determine which scan numbers to use for the background subtraction range and average range.

TODO: Need to add data validation to background/average fields.

The background fields contain the range of scans used to subtract the background signal. The software will average the signal from these scans and subtract the average from all scans. Therefore, make sure to collect background data during your experiments to obtain accurate results.

The average fields are [mostly] optional, and are used to specify the range of scans to calculate the average signal. If you don't need this feature, just make sure these are valid scan #'s!

Finally, the software can normalize the signal for each AMU using the dose of the incident beam. Enter the beam current and exposure time if you are interested in getting the integrated signal per electron.

Once your parameters are set, hit "Run" and wait. Since we're dealing with a ton of data, the analysis may take a few minutes. When finished, the results preview will appear on the right side of the screen. Each column in the table is an AMU value and the rows are each time series. You can use the dropdown to select the quantity to view.

In addition, the data is saved as an excel file to:
```
<App Directory>/output
```
