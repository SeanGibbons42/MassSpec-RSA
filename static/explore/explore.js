selectGraph// Globals
amus = [];
amudata = {};
scandata = {};
selectedFile = "";
selectedScan = 0;

$(document).ready(function(){
  getSelectedAMU();
  $("#explore-tab").addClass("sidebar-menuitem-active");

  $("#amu-select-btn").click(function(){addAMU();});
  $("#file-select").click(function(){changeFile();});
  $("#graph-select").click(function(){selectGraph();});
  $("#save-btn").click(function(){exportGraph()});

  selectedFile = $("#file-select :selected").val();

  window.addEventListener("resize", displayTimeSeries);

  activatePopovers();
  selectGraph();
});

function activatePopovers(){
  $("#settings-btn").popover({
    container: 'body',
    title: 'Select Scan',
    html: true,
    placement: 'bottom',
    sanitize: false,
    content: function(){
      return $("#popover-content").html();
    }
  });
  setupPopoverMenu();

}

function setupPopoverMenu(){
  //Add event listeners to items in the graph options popover.
  $(document.body).on("click", "#graph-refresh", function(){
  })
  $(document.body).on("input change", "#scan-select-range", function(){
    var scan_text = $(this).parent().parent().find("#scan-select-text");
    scan_text.val($(this).val())
  })
  $(document.body).on("change", "#scan-select-text", function(){
    var scan_range = $(this).parent().parent().find("#scan-select-range");
    scan_range.val($(this).val())
  })
}


function selectGraph(){
  graphType = $("#graph-select :selected").val();

  if(graphType==="time"){
    loadAMUData();
  } else if(graphType==="mass"){
    loadScanData();
  }
}

function getSelectedAMU(){
  //gets a list of currently selected AMUs
  $.ajax(amu_url,{
    method: "GET",
    success: function(data){
      amus = data;
      renderAMUTable();
      loadAMUData();
    }
  });
}

function renderAMUTable(){
  //generates table display containing selected AMU's
  $("#amu-table").html("");
  amus.forEach(function(amu, index){
    $("#amu-table").append("<tr> <td>"+amu+"</td> <td><button class=\"btn btn-outline-danger btn-sm amu-del-btn\" id=\"amubtn-"+amu+"\" amu=\""+amu+"\"><i class=\"far fa-trash-alt\"></i></button></td> </tr>");
  });
  $(".amu-del-btn").click(function(){
    delAMU($(this).attr("amu"));
  });
}

function loadAMUData(){
  /* loads intensities for all currently selected AMU's, and updates the plot. */
  amus.forEach(function(amu, index){
    //get intensities for the selected amu
    var file = $("#file-select :selected").val();
    $.ajax(inten_amu_url, {
      method: "GET",
      data: {file: file, amu: amu},
      success: function(data){
        amudata["x"] = data.scans;
        amudata[amu] = data.amus;
        displayTimeSeries();
      },
      error: function(error){},
    });
  });
}

function loadScanData(scan){
  var file = $("#file-select :selected").val();
  var scan = "1";
  $.ajax(inten_scan_url, {
    method: "GET",
    data: {file:file, scan: "1"},
    success: function(data){
      scandata["x"] = data.amulist
      scandata["inten"] = data.intensities
      displayMassSpec();
    }
  });
}

function addAMU(){
  amu = $("#amu-select").val();
  file = $("#file-select :selected").val();
  if(amu ==="" || file ===""){
    return;
  }
  $("#amu-select").val("");
  //update selected values on the server
  if(!amus.includes(amu)){
    amus.push(amu);
    renderAMUTable();
    $.ajax(amu_url,{
      method: "POST",
      data: {operation:"add", amu:amu},
      success: function(data){loadAMUData();},
      error: function(error){},
    });
  }
}

function delAMU(amu){
  if(amus.includes(amu)){
    delete amudata[amu];
  }
  $.ajax(amu_url,{
    method: "POST",
    data:{operation:"delete", amu:amu},
    success: function(data){
      amus.splice(amus.indexOf(amu),1);
      renderAMUTable();
      delete amudata[amu]
      displayTimeSeries()
    },
    error: function(error){},
  });
}

function changeFile(){
  nFile = $("#file-select :selected").val();
  if(nFile !== selectedFile){
    selectedFile = nFile;
    loadAMUData();
    displayTimeSeries();
  }
}

function maxInten(){
  max=0;
  d3.keys(amudata).forEach(function(key){
    amudata[key].forEach(function(inten){
      if(inten>max){ max = inten; }
    });
  });
  return max;
}

function maxScan(){
  return amudata["x"][amudata["x"].length-1]
}

function zipData(rawdata){
  /*
  Takes data of form {x:[...], y1:[...], yn:[...]} and outputs it in the form
  [{x1:x1, y1-1:y1-1, y1-2:y2-2}, .., {xn:xn, y1-n:y1-n y2-n:y2-n}]

  Essentially, it can take the AMU data and convert it to a d3 plottable form
  */
  outdata = [];
  keys = d3.keys(rawdata);
  ycols=keys.filter(function(key){return key!=="x"});

  rawdata.x.forEach(function(rowid, i){
    row = {x:rowid};
    ycols.forEach(function(colname, j){
      row[colname] = rawdata[colname][i];
    });
    outdata.push(row);
  });
  return outdata;
}

function displayGraph(){
  /* Displays the Type of Graph Currently selected by the user */
}

function displayTimeSeries(){
  $("#settings-btn").hide();

  var parent_height = $("#graph").height();
  var parent_width  = $("#graph").width();

  var margin = {top: 30, right: 30, bottom: 100, left: 100};
  var width = parent_width - margin.left - margin.right;
  var height = parent_height - margin.top - margin.bottom;

  var labelheight = 20;

  $("#graph").html("")
  // append the svg object to the body of the page. The SVG is the empty frame
  // we will paint the chart onto.
  var svg = d3.select("#graph")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .style("background-color", 'white')
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  //define the color scale, which matches an AMU value to a color.
  var colorlessData = zipData(amudata)
  var colorscale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(d3.keys(colorlessData[0]).filter(function(k){return k !== "x";}));

  //re-organize the data into a form that works for d3.
  var data = colorscale.domain().map(function(seriesname){
    return {
      name: seriesname,
      values: colorlessData.map(function(d){
        return {x: d.x, value: +d[seriesname]};
      }),
    };
  });

  // create X axis scale. A scale maps a data value to a position on the screen.
  var x = d3.scaleLinear()
    .domain([0, maxScan()])
    .range([ 0, width ]);

  // add the X axis to the chart.
  svg.append("g")
    .style("font-family", "Lato")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // create Y axis scale.
  var y = d3.scaleLinear()
    .domain([0, maxInten()])
    .range([ height, 0]);

  // add the Y axis to the chart
  svg.append("g")
    .style("font-family", "Lato")
    .style("font-size", "0.8em")
    .call(d3.axisLeft(y).tickFormat(d3.format('.02e')));

  // Add dots
  svg.selectAll("dots")
    .data(data)
    .enter()
      .append("g")
      .style("fill", function(d){return colorscale(d.name);})
    .selectAll("points")
      .data(function(d){return d.values;})
      .enter()
        .append("circle")
          .attr("cx", function(d){return x(d.x);})
          .attr("cy", function(d){return y(d.value);})
          .attr("r", 4)
          .attr("stroke", "white")

    //X Axis Title. We have to define the XY location precisely lol
    var xLabelXTransform = width/2;
    var xLabelYTransform = margin.top + height + 10;
    svg.append("text")
      .attr("transform", "translate("+xLabelXTransform+","+xLabelYTransform+")")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("Scan #")

    //Y Axis Title
    yLabelXTransform = 0 - margin.left;
    yLabelYTransform = 0 - height/2;
    svg.append("text")
      .attr("transform", "rotate(270)")
      .attr("y", yLabelXTransform)
      .attr("x", yLabelYTransform)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("Counts")

    //plot main title
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Time Series: " + selectedFile);

    /*                      Create the legend.                  */
    var dataL = 0;
    var offset = 50;
    var ypos = margin.top + height+20;

    //create containers for the legend entries
    var legend = svg.selectAll("legend-entry")
      .data(data)
      .enter()
        .append("g")
          .attr("transform", function(d, i){
            if(i===0){
              dataL = offset;
              return "translate(0,"+ ypos +")";
            } else {
              var newdataL = dataL;
              dataL += offset;

              str = "translate("+newdataL+" ,"+ ypos +")"

              return str;
            }
          })
    //add squares to each entry, with the color of the corresponding series.
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", function(d,i){
        return colorscale(d.name);
      })

    //now add the title [AMU Value to each entry]
    legend.append('text')
      .attr("x", 20)
      .attr("y", 10)
      .text(function(d, i){
        return d.name;
      })
      .attr("class", "textselected")
      .style("text-anchor", "start")
      .style("font-size", 15)
}

function displayMassSpec(){
  $("#settings-btn").show();
  //Container properties
  var parent_height = $("#graph").height();
  var parent_width  = $("#graph").width();

  //graph dimensions
  var margin = {top: 30, right: 30, bottom: 100, left: 100};
  var width = parent_width - margin.left - margin.right;
  var height = parent_height - margin.top - margin.bottom;
  var labelheight = 20;

  //data and data characteristics
  var amulist = scandata["x"]
  var intensities = scandata["inten"]
  var npeaks = amulist.length

  //wipe the graph
  $("#graph").html("")

  //re-structure the data
  var data = zipData({x:amulist, y:intensities});

  //create graph image [svg tag]
  var svg = d3.selectAll("#graph")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .style("background-color", 'white')
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  //X Scale [Maps x data to positions on the image]
  amurange = getXRange(amulist, 5)
  var xscale = d3.scaleLinear()
    .domain(amurange)
    .range([0, width]);

  //X Axis
  svg.append("g")
    .style("font-family", "Lato")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0,"+height+")")
    .call(d3.axisBottom(xscale));

  //Y Scale and Y axis
  intenrange = [Math.min(...intensities), Math.max(...intensities)];
  var yscale = d3.scaleLinear()
    .domain(intenrange)
    .range([height, 0]);

  svg.append("g")
    .style("font-family", "Lato")
    .style("font-size", "0.8em")
    .call(d3.axisLeft(yscale).tickFormat(d3.format('.02e')));

  // Bars
  svg.selectAll("bars")
    .data(data)
    .enter()
      .append("rect")
        .attr("x", function(d){return xscale(d.x) - getBarSize(npeaks, width, 5)/2 ;})
        .attr("y", function(d){return yscale(d.y);})
        .attr("width", getBarSize(npeaks, width, 5))
        .attr("height", function(d){return height-yscale(d.y)})

  //X Label
  var xLabelXTransform = width/2;
  var xLabelYTransform = margin.top + height + 20;
  svg.append("text")
    .attr("transform", "translate("+xLabelXTransform+","+xLabelYTransform+")")
    .style("font-family", "Lato")
    .style("font-size", "1em")
    .style("font-weight", "bold")
    .text("AMU");

  var yLabelXTransform = 0 - margin.left;
  var yLabelYTransform = 0 - height/2;
  svg.append("text")
    .attr("transform", "rotate(270)")
    .attr("y", yLabelXTransform)
    .attr("x", yLabelYTransform)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-family", "Lato")
    .style("font-size", "1em")
    .style("font-weight", "bold")
    .text("Counts");

}

function getXRange(amulist, interval){
  min = amulist[0];
  if(min % interval === 0){ min = min - 1; }
  else { min = min - min % interval; }

  max = amulist[amulist.length - 1];
  if(max%interval === 0){ max = max + 1; }
  else {  max = max + (interval - max % interval); }
  return [min, max];
}

function getBarSize(n, chartWidth, maxBarWidth){
  barWidth = Math.floor(chartWidth / n);
  return maxBarWidth < barWidth ? maxBarWidth : barWidth;
}

function exportGraph(){
  svg = $("#graph > svg").get(0)
  saveSvgAsPng(svg, selectedFile+".png", {scale:4});
}
