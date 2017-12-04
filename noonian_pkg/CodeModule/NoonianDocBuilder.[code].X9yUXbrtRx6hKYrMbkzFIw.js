function (db, nodeRequire, Q, _) {
    var fs = nodeRequire('fs');
    
    var exports = {};
    
    var toDocumentable = function( outputDir) {
        // var deferred = Q.defer();
        var bo = this;
        var className = bo._bo_meta_data.class_name;
        
        var outFile = outputDir+'/'+className+bo._id+'.js';
        console.log('writing '+outFile);
        
        //Open a write stream for the file
        var outputStream = fs.createWriteStream(outFile)
        
        _.forEach(bo._bo_meta_data.type_desc_map, function(td, fieldName) {
            var toWrite;
            if(td.type === 'jsdoc' && bo[fieldName]) {
                toWrite = '/**\n'+bo[fieldName]+'\n**/\n';
            }
            else if(td.type === 'function' && bo[fieldName]) {
                toWrite = 'var fn = '+bo[fieldName]+'\n';
            }
            if(toWrite) {
                outputStream.write(toWrite);
            }
        });
        
        outputStream.end();
        
        // return deferred.promise;
    };
    
    var listToDocumentable = function(outputDir, boList) {
        var promiseChain = Q(true);
        _.forEach(boList, function(bo) {
            promiseChain = promiseChain.then(toDocumentable.bind(bo, outputDir));
        });
        return promiseChain;
    }
    
    /**
     *  buildDocForPackage - generate jsdoc documentation for a package
     *  @param packageId id of BusinessObjectPackage
     *  @param configId id of JsdocConfig to use
     */
    exports.buildDocForPackage = function(packageId) {
        
        var bop, jsdocConfig;
        var genTargetDir;
        return db.BusinessObjectPackage.findOne({_id:packageId}).lean().then(function(result) {
            bop = result;
            if(!bop.doc_config || !bop.doc_config._id) {
                throw new Error('Missing doc config for package '+bop.key);
            }
            return db.JsDocConfig.findOne({_id:bop.doc_config._id}).lean().exec();
        })
        .then(function(result) {
            jsdocConfig = result;
            if(!jsdocConfig) {
                throw new Error('Bad JSDocConfig referenced by package '+bop.key);
            }
            
            //create temporary output directory
            var deferred = Q.defer();
            genTargetDir = '/tmp/noonian_jsdoc-'+(new Date()).getTime();
            fs.mkdir(genTargetDir, function(err) {
                if(err) deferred.reject(err);
                else deferred.resolve(genTargetDir);
            });
            
            return deferred.promise;
        })
        .then(function() {
            
            //first, create README.md
            var readmeOut = fs.createWriteStream(genTargetDir+'/README.md');
            readmeOut.write('Package:__'+bop.key+'__\n\n');
            readmeOut.write('__'+bop.name+'__ '+bop.major_version+'.'+bop.minor_version+'\n\n');
            readmeOut.write(bop.description+'\n\n');
            readmeOut.end();
            
            //Handle BusinessObjectDefs
            
            var bods = bop.manifest.BusinessObjectDef && 
                       Object.keys(bop.manifest.BusinessObjectDef);
            
            
            return db.BusinessObjectDef.writeFilesForDocs(bods, genTargetDir);
        })
        // .then(function(fieldTypesOfInterest) {
        //     //Iterate through Package business objects and create .js files
        //     var promiseArr = [];
            
        //     _.forEach(bop.manifest, function(idVerMap, className) {
        //         var boModel = db[className];
        //         var hasInterestingField = false;
        //         _.forEach(boModel._bo_meta_data.type_desc_map, function(td) {
        //             if(td.type === 'jsdoc' || td.type === 'function') {
        //                 hasInterestingField = true;
        //             }
        //         });
        //         if(hasInterestingField) {
        //             var ids = Object.keys(idVerMap);
        //             console.log('...Generating docs for %s', className);
                    
        //             promiseArr.push(
        //                 boModel.find({_id:{$in:ids}})
        //                     .then(listToDocumentable.bind(null, genTargetDir))
        //             );
        //         }
        //     });
            
        //     return Q.all(promiseArr);
        // })
        .then(function() {
            console.log('Running jsdoc against '+genTargetDir);
            
            //Create config file from JSDocConfig
            
            // var configOpts = {
            //     opts: {
            //         destination:''
            //     }
            // };
            
            // if(jsdocConfig.template) {
            //     configOpts.opts.template = jsdocConfig.template;
            // }
            
            return {output_desc:'TEST COMPLETE!'};
        })
        ;
        
        
    }
    
    return exports;
}