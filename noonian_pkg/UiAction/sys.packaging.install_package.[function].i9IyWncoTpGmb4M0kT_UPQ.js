function ($rootScope, $uibModal, $http, BusinessObjectModelFactory, Dbui) {
    
    var modalInstance;
    var scope = $rootScope.$new(true);
    
    const buildUserParamsObj = function(specObj) {
        const labels = {};
        const defaults = specObj.defauls || {};
         _.forEach(specObj.fields, (td, fname)=>{
            labels[fname] = td.label || fname;
        });
        const paramModel = BusinessObjectModelFactory.getConstructor(
              specObj.fields,
              specObj.package_key+'#params', 
              labels
        );
        const result = {package_key:specObj.package_key};
        result.paramsObj = new paramModel(defaults);
        result.perspective = specObj.perspective || {layout:Object.keys(specObj.fields)};
        result.perspective.layout = Dbui.normalizeLayout(result.perspective.layout);
        
        result.formStatus = {};
        return result;
    };
    
    
    const handleCheckResult = function(checkResult) {
        var r = scope.checkResult = scope.attemptResult = checkResult;
        console.log(r);
        if(r.error) {
            return;
        }
        
        let missingRepos = scope.missingRepos = [];
        let dr = r.dependency_resolution && r.dependency_resolution.noonian;
        if(dr) {
            ['to_install','to_upgrade'].forEach(cat=>{
                _.forEach(dr[cat], d=>{
                    if(!d.repository) {
                        missingRepos.push(d.package);
                    }
                });
            });
        }
        
        scope.anyDependencies = !!Object.keys(r.dependency_resolution).length;
        
        if(missingRepos.length || r.error) {
            scope.installReady = false;
        }
        else if(r.user_parameters) {
            scope.userParams = [];
            scope.paramFormStatus = [];
            _.forEach(r.user_parameters, upSpec=>{
                let up = buildUserParamsObj(upSpec);
                scope.paramFormStatus.push(up.formStatus);
                scope.userParams.push(up);
            });
        
            scope.$watch('paramFormStatus', ()=>{
                scope.installReady = true;
                scope.paramFormStatus.forEach(fs=>{
                    scope.installReady = scope.installReady && (fs.isValid !== false);
                });
            }, true);
        }
        else {
            scope.installReady = true;
        }
    };
    
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

        var uploadWs = 'ws/pkg/upload/checkPackage';

        scope.waiting = 'Checking Package and Dependencies...';
        $http.post(uploadWs, fd, httpConfig)
        .then(function(result) {
          scope.waiting = false;
          handleCheckResult(result.data);
        },
        function(err) {
            scope.waiting = false;
            scope.uploadResult = err;
            console.log(err);
        });
    };
    
    scope.install = function() {
        console.log(scope.userParams);
        const cr = scope.checkResult;
        const uploadWs = 'ws/pkg/installPackage?upload_id='+cr.file_id;
        const paramsObjects = {};
        
        if(cr.user_parameters) {
            //Pull in params from forms
            for(let i=0; i < cr.user_parameters.length; i++) {
                let upDef = cr.user_parameters[i];
                paramsObjects[upDef.package_key] = scope.userParams[i];
            }
        }

        scope.waiting = 'Installing...';
        $http.post(uploadWs, paramsObjects)
        .then(function(result) {
          scope.waiting = false;
          var r = scope.installResult = scope.attemptResult = result.data;
          scope.installReady = false;
          console.log(r);
          ['bower','npm'].forEach(m=>{
              _.forEach(r.dependencyResults[m], d=>{
                  if(d.result === 'error') {
                      scope.anyError = true;
                  }
              })
          })
          
          
        });
    };
    
    scope.clear = function() {
        scope.checkResult = scope.installResult = scope.installReady = scope.attemptResult = null;
        scope.waiting = false;
    };
    
    scope.initRemote = function() {
        if(!scope.remoteList) {
            $http.get('ws/pkg/listRemotePackages').then(result=>{
                scope.remoteList = result.data;
            });
        }
    };
    scope.checkPkg = function(rmt, pkg) {
        scope.waiting = "Checking Package and Dependencies...";
        $http.get(`ws/pkg/checkPackage?repo=${rmt.repo._id}&key=${pkg.key}`).then(function(result){
            scope.waiting = false;
            handleCheckResult(result.data);
        });
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