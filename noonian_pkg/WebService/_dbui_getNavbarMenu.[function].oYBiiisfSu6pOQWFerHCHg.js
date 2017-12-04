function (config, req, db, _) {
    var configKey = 'sys.dbui.navbar_menu';
    
    var fullBoList = {};
    
    
    var buildSubmenuContainer = function(categoryObj) {
        
        var submenuContainer = { label:categoryObj.title, submenu:[] };
        
        _.forEach(categoryObj.classes, function(boClass) {
            submenuContainer.submenu.push({
                action: {
                    state: "dbui.list",
                    params: { className:boClass, perspective:"default" }
                },
                label:boClass
            });
            delete fullBoList[boClass];
        });
        
        return submenuContainer;
    }
    
    return db.BusinessObjectDef.find({}).then(function(boList) {
        _.forEach(boList, function(bo) {
            fullBoList[bo.class_name] = bo._id;
        });
        
        return config.getCustomizedParameter(configKey, req.user._id);
    })
    .then(function(categoryArr) {
        //for now, menukey contains categorized list of BusinessObject names:
        /*
            [
                { title:"Angular Dev", classes:["AngularModule","AngularBlah",...] },
                { ... },
                ...
            ]
        */
        
        var menuArr = [];
        _.forEach(categoryArr, function(categoryObj) {
            menuArr.push(buildSubmenuContainer(categoryObj));
        });
        
        
        //Divvy the ones not covered in sys.dbui.navbarmenu according to package.
        if(Object.keys(fullBoList).length) {
            return db.BusinessObjectPackage.find({}, {name:1, 'manifest.BusinessObjectDef':1}).sort({name:1}).then(function(bops) {
                //map package to classes
                var pkgToClasses = {};
                
                _.forEach(bops, function(bopObj) {
                    if(bopObj.manifest && bopObj.manifest.BusinessObjectDef) {
                        var pkgBos = bopObj.manifest.BusinessObjectDef;
                        _.forEach(fullBoList, function(boId, boClass) {
                            if(pkgBos[boId]) {
                                pkgToClasses[bopObj.name] = pkgToClasses[bopObj.name] || [];
                                pkgToClasses[bopObj.name].push(boClass);
                                
                            }
                        })
                    }
                });
                
                _.forEach(pkgToClasses, function(classArr, pkgName) {
                    classArr.sort();
                    menuArr.push(buildSubmenuContainer({title:pkgName, classes:classArr}));
                });
                
                var remaining = Object.keys(fullBoList);
                if(remaining.length) {
                    remaining.sort();
                    menuArr.push(buildSubmenuContainer({title:"(no package)", classes:remaining}));
                }
                
                return menuArr;
            });
        }
        else {
            return menuArr;
        }
    });
    
}