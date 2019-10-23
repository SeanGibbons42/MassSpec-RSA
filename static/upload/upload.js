$(document).ready(function(){
  $("#import-tab").addClass("sidebar-menuitem-active");
  $("#selectfile-btn").click(function(){requestFileList()});
  $("#transpath-btn").click(function(){postTransform()});
});

function requestFileList(){
  //request a list of files in our folder
  path = $("#inpath-txt").val()
  $.ajax(upload_url, {
    method: "GET",
    data: {"path":path},
    success:function(data){
      recieveFileList(data);
    },
    error: function(a,b){
      console.log("Error");
      if (a.status === 404) {
        alert("That folder does not exist");
      } else{
        alert("Internal Server Error.");
      }
    },
  });
}

function postTransform(data){
  //move the files from one folder to another
  inpath = $("#inpath-txt").val()
  outpath = $("#transpath-txt").val()

  $.ajax(transform_url, {
    method: "POST",
    data: {"inpath":inpath, "outpath":outpath},
    success: function(data){
      recieveTransform(data);
    },
    error: function(a,b,c){
      alert(a);
    }
  });
}

function recieveFileList(data){
  flist = $("#filelist");
  flist.empty();
  for(i=0; i<data.length; i++){
    tag = "<p>" + data[i] + "</p>"
    flist.append(tag);
  }
}

function recieveTransform(data){
  console.log(data)
}
