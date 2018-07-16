function (db, Q, _, config) {
    /**
     * AngularApp.serveContent
     * 
     */ 
    return function (outStream) {
        var appObj = this;
        var myPath = this.path;
        var moduleObj;
        
        var initialPromise;
        if(appObj.module) {
            initialPromise = db.AngularModule.findOne({_id:appObj.module._id}).exec();
        }
        else {
            initialPromise = Q(false);
        }
        
        return initialPromise.then(function(result) {
            if(result) {
                moduleObj = result;
                //getDependencyTags recurses dependency tree to build full list of css and js dependencies
                return moduleObj.getDependencyTags();
            }
            else {
                return {css:'',js:''};
            }
        })
        .then(function(moduleDepTags) {
            
            if(typeof outStream.type === 'function') {
                outStream.type('html');
            }
            
            var moduleName = moduleObj ? moduleObj.name : appObj._id;
            
            var header = '<!doctype html>';
            
            header += '<html ng-app="'+moduleName+'">';
            
            
            header += '<head>'
            header += '<base href="'+config.serverConf.urlBase+'/">';
            
            
            //Module CSS dependencies
            header += moduleDepTags.css;
            
            header += appObj.head+'\n';
            
            outStream.write(header);
            
            
            //App CSS dependencies
            if(appObj.css_dependencies && appObj.css_dependencies.length) {
                _.forEach(appObj.css_dependencies, function(cssDep) {
                    outStream.write('<link rel="stylesheet" href="'+cssDep.path+'/'+cssDep.name+'">\n');
                });
            }
            
            //Module JS dependencies
            outStream.write('\n'+moduleDepTags.js+'\n');
            
            //App JS dependencies
            if(appObj.js_dependencies && appObj.js_dependencies.length) {
                _.forEach(appObj.js_dependencies, function(jsDep) {
                    outStream.write('<script src="'+jsDep.path+'/'+jsDep.name+'"></script>\n');
                });
            }
            
            //App's config function            
            if(appObj.config_function) {
                outStream.write('<script type="text/javascript">\n');
                
                outStream.write('angular.module(');
                if(moduleObj) {
                    outStream.write('\''+moduleName+'\'');
                }
                else{
                    //Define module here if it isn't part of a pre-defined one
                    outStream.write('\''+moduleName+'\', []');
                }
                outStream.write(').config('+appObj.config_function+');\n');
                
                outStream.write('</script>');
            }
            
            outStream.write('</head>\n');
            
            var addBodyTag = (appObj.body.substring(0, 5) !== '<body');
            
            if(addBodyTag) {
                outStream.write('<body>\n');
            }
            else {
                appObj.body = appObj.body.replace('</body>', '');
            }
            
            outStream.write(appObj.body+'\n');
            
            // outStream.write(appObj.body+'\n'+moduleDepTags.js+'\n');
            
            // if(appObj.js_dependencies && appObj.js_dependencies.length) {
            //     _.forEach(appObj.js_dependencies, function(jsDep) {
            //         outStream.write('<script src="'+jsDep.path+'/'+jsDep.name+'"></script>\n');
            //     });
            // }
            

            
            outStream.write('</body></html>');
            
            return outStream.end();
            
        });
        
    }
}