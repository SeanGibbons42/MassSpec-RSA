amus = [];

$(document).ready(function(){
  $("#analyze-tab").addClass("sidebar-menuitem-active");
  getSettings()
  $("#analysis-file-but").click(function(){fileDialog();});
  $("#analysis-file-dialog").change(function(){selectFile();});

  $("#analysis-btn").click(function(){
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
  var avgstart = $("#avgstart").val()
  var avgend = $("#avgend").val()
  var beamcurrent = $("#beamcurrent").val();
  var exptime = $("#exptime").val();
  showProgress();
  $.ajax(analysisURL, {
    type: "POST",
    data: {
      bgstart: bgstart,
      bgend: bgend,
      avgstart: avgstart,
      avgend: avgend,
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
      $("#avgstart").val(data.avg_start);
      $("#avgend").val(data.avg_end);
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
        var amus = sortAMU(data);
        var colwidth = 1/(amus.length+1)*100;

        var thead = $("#output-thead");
        thead.html("");
        style=" style=\"width:"+colwidth+"%\""
        thead.append("<th"+style+">FileName</th>");
        //add amu headers to the table
        amus.forEach(function(amu){
          thead.append("<th"+style+">"+amu+"</th>");
        });
    }
  });
}

function makeTbody(amus, data){
  tbody = $("#output-tbody");
  tbody.html("");

  qty = $("#qty-select :selected").val();
  amus = sortAMU(amus);

  files = data.files
  data = data.data

  files.forEach(function(file){
    nline = "<tr>"
    nline = nline + "<td>"+ file +"</td>"
    amus.forEach(function(amu){
      console.log(file +" "+amu+" "+qty)
      ndata = data[file][amu][qty]
      ndata = expo(ndata, 3)
      nline = nline + "<td>" + ndata + "</td>"
    });
    nline = nline + "</tr>"
    tbody.append(nline)
  })
}

function sortAMU(amudata){
  //convert amuu's to ints and sort
  amus = amudata.map(function(amuStr){
    return parseInt(amuStr)
  });
  return amus.sort();
}

function expo(x, f) {
  return Number.parseFloat(x).toExponential(f);
}
