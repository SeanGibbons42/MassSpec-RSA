$(document).ready(function(){
  // $(".sidebar-menuitem").click
});

function showProgress(nfiles){
  // $("#progress").html("");
  // $("#nfiles").html(nfiles);
  $("#prog-counter").removeClass("invis");
}

function hideProgress(){
  $("#prog-counter").addClass("invis");
}

function reset_menubar(){
  $("#import-tab").removeClass("sidebar-menuitem-active")
  $("#explore-tab").removeClass("sidebar-menuitem-active")
  $("#analyze-tab").removeClass("sidebar-menuitem-active")
}
