'use strict';

var controllers = angular.module('controllers', []);

controllers.controller('UploadController',['$scope', 'ConfigService', function($scope, ConfigService) {
  $scope.sizeLimit      = 10585760; // 10MB in Bytes
  $scope.uploadProgress = 0;
  $scope.creds          = {};
  $scope.files           = [];  


  $scope.init = function(){
    // Get the config JSON file to populate the fields
    /*$.getJSON("config.json", function(data){      
      $('input.access_key').val(data.ID);
      $('input.secret_key').val(data.PW);
      $('input.bucket').val(data.bucket);
    });*/

    var promise = ConfigService.getConfig();    
    promise.then(
      function(payload){                
        // Successfully loaded the file
       $scope.creds.access_key = payload.ID;
       $scope.creds.secret_key = payload.PW;
       $scope.creds.bucket = payload.bucket;


      },function(errorPayload){
        console.log("Bad b/c " + errorPayload);
    });
    
  };

    /**
  * Get the contents of the bucket specified
  */
  $scope.reloadBucket = function(){
    $scope.files = [];
    var bucket = new AWS.S3({params: {Bucket: $scope.creds.bucket} });
    AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
    AWS.config.region = 'us-east-1';

    var params = { Bucket: $scope.creds.bucket };    

    bucket.listObjects(params, function(err, data){
      if(err){
        toastr.error(err.message,err.code);
        return false;
      }else{ // Data retrieved
        //$scope.files = data.Contents;
        for(var i=0; i<data.Contents.length; i++){
          if(isImage(data.Contents[i].Key))
            $scope.files.push(data.Contents[i]);
        }        
        $scope.$apply();
      }
    });

  };

  $scope.upload = function() {
    var bucket = new AWS.S3({ params: { Bucket: $scope.creds.bucket } });
    AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
    AWS.config.region = 'us-east-1';        

    if($scope.file) {
        // Perform File Size Check First
        var fileSize = Math.round(parseInt($scope.file.size));
        if (fileSize > $scope.sizeLimit) {
          toastr.error('Sorry, your attachment is too big. <br/> Maximum '  + $scope.fileSizeLabel() + ' file attachment allowed','File Too Large');
          return false;
        }
        // Prepend Unique String To Prevent Overwrites
        //var uniqueFileName = $scope.uniqueString() + '-' + $scope.file.name;
        var uniqueFileName = $scope.file.name;

        var params = { Key: uniqueFileName, ContentType: $scope.file.type, Body: $scope.file, ServerSideEncryption: 'AES256' };

        bucket.putObject(params, function(err, data) {
          if(err) {
            toastr.error(err.message,err.code);
            return false;
          }
          else {
            // Upload Successfully Finished
            toastr.success('File Uploaded Successfully', 'Done');

            // Reset The Progress Bar
            setTimeout(function() {              
              $scope.uploadProgress = 0;
              $scope.$digest();
            }, 4000);
          }
        })
        .on('httpUploadProgress',function(progress) {          
          $scope.uploadProgress = Math.round(progress.loaded / progress.total * 100);
          $scope.$digest();
        });
      }
      else {
        // No File Selected
        toastr.error('Please select a file to upload');
      }
    }

    $scope.fileSizeLabel = function() {
    // Convert Bytes To MB
    return Math.round($scope.sizeLimit / 1024 / 1024) + 'MB';
  };

  $scope.uniqueString = function() {
    var text     = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // Returns true if the file is a valid image format; false otherwise
  function isImage(filename){        
    var splitVal = filename.split(".");
    var fileType = splitVal[splitVal.length-1].toLowerCase();
    switch(fileType){
      case "jpg":
      case "jpeg":
      case "gif":
      case "png":
        return true;
        break;

      default:
        return false;
        break;
    }
  }

}]);
