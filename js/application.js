'use strict';

var app = angular.module('angular-s3-upload', [	
    'controllers',
    'directives'    
]);

app.service('ConfigService', function($http, $q){
	var _this = this;
	var _data = [];

	this.getConfig = function(){
		var defer = $q.defer();		
		var _data = [];

		$http.get('config.json')
        	.success(function(data) {        		
            	angular.extend(_this, data);
                defer.resolve(data);                
                _data.push(data);
            })
            .error(function() {
                defer.reject('could not find someFile.json');
            });

        return defer.promise;		
	};

	
});