function (db, _, Q) {
    const request = require('request');
    
    const semver = require('semver');
    
    //Can take this out once all hosted package versions are properly converted
    const getPkgVersion = function(bop) {
		var v = bop.version || ((bop.major_version||'0')+'.'+(bop.minor_version||'0')+'.0');
		return new semver(semver.coerce(v)).toString();
	};
	
	const isNewer = function(a, b) {
	    //is a newer than b?
	    let aPieces = a.split('.');
	    let bPieces = b.split('.');
	    if(aPieces.length === 3 && bPieces.length === 3) {
	        for(let i=0; i < 3; i++) {
	            if(+aPieces[i] > +bPieces[i]) {
	                return true;
	            }
	        }
	    }
	    return false;
	};
    
    const callRemoteRepo = function(rpr) {
		const deferred = Q.defer();

		if(!rpr || !rpr.url || !rpr.auth || !rpr.auth.token) {
			deferred.reject('Bad RemotePackageRepository entry');
		}
		
		const fullUrl = `${rpr.url}/ws/package_repo/getMetaData`;
		
		request(
			{
				method:'GET',
				uri:fullUrl,
				auth:{bearer:rpr.auth.token},
				json:true
			},
			function(err, httpResponse, body) {
				if(err || body.error) {
					// console.error(err || body.error);
					return deferred.reject(err || body.error);
				}
				
				//Can take this out once all hosted package versions are properly converted
				_.forEach(body, md=>{
				    if(!md.version) {
				        md.version = getPkgVersion(md);
				    }
				});

				deferred.resolve({
					repo:{name:rpr.name, _id:rpr._id, url:rpr.url},
					metadata:body  // pkgkey->metadata obj
				});
			}
		);

		return deferred.promise;
	};
	
	return db.RemotePackageRepository.find({}).then(rprList=>{
		const promiseList = [];
		_.forEach(rprList, rpr=>{
			promiseList.push(callRemoteRepo(rpr));
		});

		return Q.allSettled(promiseList).then(function(promises) {
			var result = [];
			_.forEach(promises, p=>{
				if(p.state === 'fulfilled') {
					result.push(p.value);
				}
			});
			return result;
		})
		;
	})
	.then(resultObj=>{
	    //Now, scan result object to mark status on each package
	    return db.BusinessObjectPackage.find({}).then(bopList=>{
	        const installed = {};

			_.forEach(bopList, bop => {
				installed[bop.key] = getPkgVersion(bop).toString();
			});
			
			_.forEach(resultObj, rmtList => {
			    _.forEach(rmtList.metadata, md => {
			        let k = md.key;
			        let hostedVersion = md.version;
			        let installedVersion = installed[k];
			        if(installedVersion === hostedVersion) {
			            md.status = 'installed';
			        }
			        else if(installedVersion && isNewer(hostedVersion, installedVersion)) {
			            md.status = 'upgrade';
			        }
			    });
			})
			
			return resultObj;
	    });
	}) 
	;
}