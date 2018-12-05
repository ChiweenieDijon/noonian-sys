function ($rootScope, $uibModal, $http, BusinessObjectModelFactory, Dbui) {
    
    var modalInstance;
    var scope = $rootScope.$new(true);
    
    scope.fileChanged = function(elem) {
        
        if(!elem || !elem.files || !elem.files.length) {
            scope.fileObj = scope.fileData = null;
            return;
        }
        
        const fileObj = scope.fileObj = elem.files[0];

        scope.fileData = {
          filename:fileObj.name,
          size:fileObj.size,
          type:fileObj.type
        };
        
        scope.uploadFile();

    };
    
    scope.uploadFile = function() {
        var fd = new FormData();
        fd.append('pkgStream', scope.fileObj);

        var httpConfig = {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        };

        var uploadWs = 'ws/pkg/checkPackage';

        scope.waiting = 'Checking Package and Dependencies...';
        $http.post(uploadWs, fd, httpConfig)
        .then(function(result) {
          scope.waiting = false;
          var r = scope.checkResult = result.data;
          console.log(r);
          
          if(r.user_parameters) {
            var labels = {};
            var defaults = r.user_parameters.defauls || {};
             _.forEach(r.user_parameters.fields, (td, fname)=>{
                labels[fname] = td.label || fname;
            });
            var paramModel = BusinessObjectModelFactory.getConstructor(
                  r.user_parameters.fields,
                  r.key+'#params', 
                  labels
            );
            scope.paramsObj = new paramModel(defaults);
            scope.paramsPerspective = r.user_parameters.perspective || {layout:Object.keys(r.user_parameters.fields)};
            scope.paramsPerspective.layout = Dbui.normalizeLayout(scope.paramsPerspective.layout);
            
            scope.paramFormStatus = {};
            scope.$watch('paramFormStatus', ()=>{
                scope.installReady = (!r.error) && (scope.paramFormStatus.isValid !== false);
            }) 
          }
          else {
              scope.installReady = (!r.error);
          }
          
          
        },
        function(err) {
            scope.waiting = false;
            scope.uploadResult = err;
            console.log(err);
        });
    };
    
    scope.install = function() {
        console.log(scope.paramsObj);
    };
    
    modalInstance = $uibModal.open({
        templateUrl:'sys/packaging/install_pkg_dialog.html',
        size:'lg',
        scope: scope
    });
    
    modalInstance.result.then(()=>{
        console.log('yay!');
    });
      
}