function (db, Q, _) {
    const fs = require('fs');
    
    const exports = {};
    
    
    const mkdirRecursive = function(dir) {
        const dirs = dir.split('/');
        if(dirs[0] === '') {
            dirs.splice(0, 1);
            dirs[0] = '/'+dirs[0];
        }
        
        var build = '';
        for(var i=0; i < dirs.length; i++) {
            build += dirs[i];
            if(!fs.existsSync(build)) {
                fs.mkdirSync(build);
            }
            build += '/';
        }
    };
    
    const exportModule = 
    exports.exportModule = function(moduleId, outputDir) {
        //Serve content to file output stream
        //  this will include all providers in one file.  TODO optionally split out according to "path" field
        var modObj; 
        
        return Q.all([
            db.AngularModule.findOne({_id:moduleId}).exec(),
            db.AngularTemplate.find({'module._id':moduleId}).exec()
        ])
        .then(function([modObj, templates]) {
            
            var modOutDir = outputDir+'/'+modObj.path;
            mkdirRecursive(modOutDir);
            
            var outStream = fs.createWriteStream(modOutDir+'/'+modObj.name);
            modObj.serveContent(outStream);
            
            //Next, take care of all templates belonging to this module
            _.forEach(templates, templateObj => {
                var tempOutDir = outputDir+'/'+templateObj.path;
                mkdirRecursive(tempOutDir);
                
                var outStream = fs.createWriteStream(tempOutDir+'/'+templateObj.name);
                outStream.write(templateObj.content);
                outStream.end();
            });
            
            
            //Recursively generate mod_dependencies
            var depPromises = [];
            _.forEach(modObj.mod_dependencies, depRef => {
                depPromises.push(exportModule(depRef._id, outputDir));
            }); 
            
            return Q.all(depPromises);
        });
        
    };

    const exportApp = 
    exports.exportApp = function(appId, outputDir) {
        
        //First, AngularApp itself:
        return db.AngularApp.findOne({_id:appId}).then(function(appObj) {
            
            var appOutDir = outputDir+'/'+appObj.path;
            mkdirRecursive(appOutDir);
            
            var outStream = fs.createWriteStream(appOutDir+'/'+appObj.name);
            appObj.serveContent(outStream);
            
            //Then, module and dependencies:
            if(appObj.module && appObj.module._id) {
                return exportModule(appObj.module._id, outputDir);
            }  
        })
        .then(function() {
            return {result:'success'};
        })
        ;
        
    };

    return exports;
}