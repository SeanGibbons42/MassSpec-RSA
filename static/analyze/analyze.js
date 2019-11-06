amus = [];

$(document).ready(function(){
  $("#analyze-tab").addClass("sidebar-menuitem-active");
  getSettings()
  $("#analysis-file-but").click(function(){fileDialog();});
  $("#analysis-file-dialog").change(function(){selectFile();});

  $("#analysis-btn").click(function(){
    console.log("Button Pressed");
    runAnalysis();
  });

  $("#qty-select").click(function(){getResults();});

  makeThead();
});

function fileDialog(){
  $("#analysis-file-dialog").click();
}

function selectFile(){
  fname = $("#analysis-file-dialog").val();
  $("#savepath").val(fname);
}

function runAnalysis(){
  var bgstart = $("#bgstart").val()
  var bgend = $("#bgend").val()
  var beamcurrent = $("#beamcurrent").val();
  var exptime = $("#exptime").val();
  showProgress();
  $.ajax(analysisURL, {
    type: "POST",
    data: {
      bgstart: bgstart,
      bgend: bgend,
      beamcurrent: beamcurrent,
      exptime: exptime,
    },
    success: function(data){
      hideProgress();
      makeTbody(amus, data);
    },
    error: function(error){
      hideProgress();
    }
  });
}

function getSettings(){
  $.ajax(analysisSettingURL, {
    method: "GET",
    success: function(data){
      $("#bgstart").val(data.bg_start);
      $("#bgend").val(data.bg_end);
      $("#exptime").val(data.exposure_time);
      $("#beamcurrent").val(data.beam_current);
    },
    error: function(error){},
  });
}

function getResults(){
  $.ajax(analysisURL,{
    method: "GET",
    success: function(data){
      makeTbody(amus, data);
    }
  });
}

function makeThead(){
  $.ajax(amu_url, {
    method: "GET",
    success: function(data){
        amus = sortAMU(data);
        colwidth = 1/(amus.length+1)*100;
        thead = $("#output-thead");
        thead.html("");
        style=" style=\"width:"+colwidth+"%\""
        thead.append("<th"+style+">FileName</th>");
        //add amu headers to the table
        amus.forEach(function(amu){
          thead.append("<th"+style+">"+amu+"</th>");
        });
        console.log(thead.html())
    }
  });
}

function makeTbody(amus, data){
  tbody = $("#output-tbody");
  tbody.html("");

  qty = $("#qty-select :selected").val();
  console.log(qty);
  amus = sortAMU(amus);

  for(file in data){
    nline = "<tr>"
    nline = nline + "<td>"+ file +"</td>"
    amus.forEach(function(amu){
      nline = nline + "<td>" + data[file][amu][qty] + "</td>"
    });
    nline = nline + "</tr>"
    tbody.append(nline)
  }
}

function sortAMU(amudata){
  //convert amuu's to ints and sort
  amus = amudata.map(function(amuStr){
    return parseInt(amuStr)
  });
  return amus.sort();
}
