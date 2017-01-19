function (db, queryParams, httpRequestLib, Q, _) {
    var PackagingService = db._svc.PackagingService;
    
    var repoUrl;
    var authHeader;
    
    var myPackages = {}; //Packages I already have - check for upgrade
    var toInstall = {};  //Packages to install (from rpr.package_keys) - pull latest version
    
    var repoBo;
    
    return db.RemotePackageRepository.findOne({_id:queryParams.id}).then(function(rpr) {
        if(!rpr) {
            throw 'invalid remotePackageRepo id';
        }
        repoBo = rpr;
        
        _.forEach(rpr.packages, function(pkgRef) {
            myPackages[pkgRef.key] = {major:pkgRef.major_version, minor:pkgRef.minor_version};
        });
        
        _.forEach(rpr.package_keys, function(pkgKey) {
           toInstall[pkgKey] = true; 
        });
        
        console.log('Checking update for packages: %j', myPackages);
        console.log('And attempting install for: %j', Object.keys(toInstall));
        repoUrl = rpr.url;
        authHeader = { authorization:'Bearer '+rpr.auth.token};
        
        var deferred = Q.defer();
        httpRequestLib.get( {
              uri:repoUrl+'/ws/package_repo/getList',
              headers:authHeader,
              rejectUnauthorized: false
          }, function(err, httpResponse, body) {
              if(err) {
                  deferred.reject(err);
              }
              else {
                  try {
                    deferred.resolve(JSON.parse(body));
                  }
                  catch(err) {
                      deferred.reject(err);
                  }
              }
          });
          return deferred.promise;
        
    })
    .then(function(pkgList){
        // console.log('Received pkg list: %j', pkgList);
        var toUpgrade = {};
        var workToDo = false;
        
        _.forEach(pkgList, function(remotePkg) {
            var localVersion = myPackages[remotePkg.key];
            if(localVersion) {
                var remoteVersion = PackagingService.parseVersionString(remotePkg.latest_version);
                // console.log('Checking %s against remote version %j', remotePkg.key, remoteVersion);
                if(remoteVersion.compareTo(localVersion) > 0) {
                    //Scan through available versions; find the first one that is newer than localVersion
                    for(var i=0; i < remotePkg.available_versions.length; i++) {
                        var v = PackagingService.parseVersionString(remotePkg.available_versions[i]);
                        if(v.compareTo(localVersion) > 0) {
                            toUpgrade[remotePkg.key] = v;
                            workToDo = true;
                            break;
                        }
                    }
                    
                }
            }
            else if(toInstall[remotePkg.key]) {
                toUpgrade[remotePkg.key] = remotePkg.latest_version;
                workToDo = true;
            }
        });
        
        //toUpgrade now maps pkg keys to target upgrade versions
        if(workToDo) {
            var summaryString = '';
            var installedKeys = [];
            var promiseChain = Q(true);
            _.forEach(toUpgrade, function(askForVersion, key) {
                summaryString += key+' '+askForVersion.toString()+', ';
                
                promiseChain = promiseChain.then(function() {
                    
                    if(toInstall[key]) {
                        installedKeys.push(key);
                    }
                    
                    var requestParams = {
                        uri:repoUrl+'/ws/package_repo/getPackage?key='+key+'&version='+askForVersion.toString(),
                        headers:authHeader,
                        rejectUnauthorized: false
                    };
                    
                    var pkgStream = httpRequestLib.get(requestParams);
                    return PackagingService.applyPackageStream(pkgStream);
                });
            });
            console.log('attempting updates: %s', summaryString);
            
            //replace repoBo.package_keys with refs in repoBo.packages
            
            promiseChain = promiseChain.then(function() {
                if(installedKeys.length) {
                    
                    return db.BusinessObjectPackage.find({}).then(function(bopArr) {
                        
                        var keyToBop = {};
                        _.forEach(bopArr, function(bop) {
                            keyToBop[bop.key] = bop;
                        });
                        
                        var retain = [];
                        _.forEach(installedKeys, function(installedKey) {
                            var bop = keyToBop[installedKey];
                            if(bop) {
                                repoBo.packages.push({
                                    _id:bop._id, 
                                    _disp:bop._disp, 
                                    key:bop.key, 
                                    major_version:bop.major_version, 
                                    minor_version:bop.minor_version
                                }); //work-around for Issue 28
                            }
                            else {
                                retain.push(installedKeys);
                            }
                        });
                        
                        repoBo.package_keys = retain;
                        return repoBo.save();
                    });
                }
                else {
                    return true;
                }
            });
            
            
            return promiseChain.then(function() {
               return {message: 'Upgrade complete: '+summaryString}; 
            });
        }
        else {
            return({message:'all packages already up-to-date!'});
        }
    });
}