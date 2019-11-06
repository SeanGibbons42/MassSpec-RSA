// Globals
var amus = [];
var amudata = {};
var selectedFile = "";

$(document).ready(function(){
  getAMU();
  $("#explore-tab").addClass("sidebar-menuitem-active");
  $("#amu-select-btn").click(function(){addAMU();});
  $("#file-select").click(function(){changeFile();});
  window.addEventListener("resize", displayGraph);
});

function getAMU(){

  $.ajax(amu_url,{
    method: "GET",
    success: function(data){
      amus = data;
      renderAMU();
      loadAMUData();
    }
  });
}

function renderAMU(){
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
    file = $("#file-select :selected").val();
    $.ajax(inten_url, {
      method: "GET",
      data: {file: file, amu: amu},
      success: function(data){
        amudata["x"] = data.scans;
        amudata[amu] = data.amus;
        displayGraph();
      },
      error: function(error){},
    });
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
    renderAMU();
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
      amus.splice(amus.indexOf(amu),1); renderAMU();
      delete amudata[amu]
      displayGraph()
    },
    error: function(error){},
  });
}

function changeFile(){
  nFile = $("#file-select :selected").val();
  if(nFile !== selectedFile){
    selectedFile = nFile;
    console.log(selectedFile);
    loadAMUData();
    displayGraph();
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

  Essentially, it can take the AMU data and convert it to a plottable form
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
  parent_height = $("#graph").height();
  paretn_width  = $("#graph").width();

  var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = paretn_width - margin.left - margin.right,
    height = parent_height - margin.top - margin.bottom;

$("#graph").html("")
// append the svg object to the body of the page
var svg = d3.select("#graph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

colorlessData = zipData(amudata)
var colorscale = d3.scaleOrdinal(d3.schemeCategory10)
  .domain(d3.keys(colorlessData[0]).filter(function(k){return k !== "x";}));


data = colorscale.domain().map(function(seriesname){
  return {
    name: seriesname,
    values: colorlessData.map(function(d){
      return {x: d.x, value: +d[seriesname]};
    }),
  };
});

  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, maxScan()])
    .range([ 0, width ]);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, maxInten()])
    .range([ height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));


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

  // svg.append('g')
  //   .selectAll("dot1")
  //   .data(data)
  //   .enter()
  //   .append("circle")
  //     .attr("cx", function (d) { return x(d.x); } )
  //     .attr("cy", function (d) { return y(d.y); } )
  //     .attr("r", 3)
  //     .style("fill", "#69b3a2")


}
