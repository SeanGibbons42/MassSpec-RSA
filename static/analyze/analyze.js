$(document).ready(function(){
  $("#analyze-tab").addClass("sidebar-menuitem-active");
  getSettings()
  $("#analysis-file-but").click(function(){fileDialog();});
  $("#analysis-file-dialog").change(function(){selectFile();});
});

function fileDialog(){
  $("#analysis-file-dialog").click();
}

function selectFile(){
  fname = $("#analysis-file-dialog").val();
  $("#savepath").val(fname);
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
