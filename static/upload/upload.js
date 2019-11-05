progress = 0;
nfiles = 0;

$(document).ready(function(){
  $("#import-tab").addClass("sidebar-menuitem-active");
  $("#selectfile-btn").click(function(){requestFolderList()});
  $("#transpath-btn").click(function(){postTransform()});

  uploadBtn = "#upload-btn";
  uploadDialog = "#upload-file-dialog";
  uploadFile = "#upload-file";

  $(uploadBtn).click(function(){fileDialog(uploadDialog)});
  $(uploadDialog).change(function(){uploadFolder(uploadDialog, uploadFile, "#uploadpath-txt")});

  requestFolderList();
  getActiveFolder();
});

function fileDialog(dialog){
  //Simulate a click on the hidden dialog button
  $(dialog).click();
}

function uploadFolder(dialog, fileElement, outputElement){
  //extract the files from the fileselect element
  var files = $(dialog).prop("files");
  var fileList = [];
  var relativePath = files[0].webkitRelativePath;
  var folder = relativePath.split("/")[0];
  var name = relativePath.split("/")[1];

  nfiles = files.length;
  showProgress(nfiles);

  for(var i = 0; i<files.length; i++){
    fileList.push( files[i] );
  }

  fileList.forEach(function(file){
    relpath = file.webkitRelativePath;
    folder = relpath.split("/")[0];
    name = relpath.split("/")[1];
    sendFile(file, name, folder);
  });

  $(outputElement).val(folder);
}

function sendFile(file, name, folder){
  var formData = new FormData();
  formData.set('file', file)
  formData.set("folder", folder)
  formData.set("name", name)
  console.log(folder)
  $.ajax(upload_url, {
    type: 'POST',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    success: function(data){
      console.log("success");
      requestFolderList();
      fileProgressInc(nfiles);
    },
  });
}

function setActiveFolder(folder){
  $.ajax(activeFolderUrl, {
    data: {folder: folder},
    type: "POST",
    success: function(){
      folderRow = "#"+folder+"---row";
      $(".folder-row").removeClass("folder-active");
      $(folderRow).addClass("folder-active");
      console.log(folderRow);
      requestFileList(folder);
    }
  });
}

function getActiveFolder(){
  $.ajax(activeFolderUrl, {
    type: "GET",
    success: function(data){
      setActiveFolder(data.folder);
    }
  });
}

function requestFolderList(){
  $.ajax(folder_url,{
    type: "GET",
    success: function(data){
      console.log(data);
      recieveFolderList(data);
    },
  });
}

function requestFileList(folder){
  //request a list of files in our folder

  $.ajax(file_url, {
    type: "GET",
    data: {"folder":folder},
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

function deleteFolder(folder){
  $.ajax(del_folder_url,{
    type: "POST",
    data: {folder: folder},
    success: function(data){requestFolderList()},
    error: function(error){alert(error)},
  })
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

function recieveFolderList(data){
  folderlist = $("#folderlist");
  foldertbl = $("#folderlist-body");
  foldertbl.empty();
  //generate and append a table row for each folder
  for(i=0; i<data.length; i++){
    selID = " id=\""+data[i]+"---sel\" "
    delID = " id=\""+data[i]+"---del\""
    rowID = " id=\""+ data[i] +"---row\""
    selbut = "<button class=\"btn btn-outline-secondary btn-sm folder-btn\""+selID+"> Select </button>";
    delbut = "<button class=\"btn btn-outline-danger btn-sm folder-btn\""+delID+"> Delete </button>"
    nline = "<tr class=\"folder-row\" "+rowID+"> <td> "+ data[i] +" </td> <td> "+selbut+delbut+" </td>  </tr>"
    foldertbl.append(nline);
  }
  $(".folder-btn").click(function(){
    console.log("pressed")
    folder = $(this).attr('id').split("---")[0];
    action = $(this).attr('id').split("---")[1];
    if(action==="del"){
      deleteFolder(folder);
    } else if(action==="sel") {
      requestFileList(folder);
      setActiveFolder(folder);
    }
  });
}

function recieveTransform(data){
  console.log(data)
}

function showProgress(nfiles){
  // $("#progress").html("");
  // $("#nfiles").html(nfiles);
  $("#prog-counter").removeClass("invis");
}

function hideProgress(){
  $("#prog-counter").addClass("invis");
}

function fileProgressInc(nfiles){
  //increment the upload progress counter
  progress++;

  if (progress === nfiles){
    hideProgress();
  }
}
