function (db, queryParams, res, Q, _) {
    var pkg = queryParams.package;
    
    if(!pkg) {
        throw new Error('missing required parameter "package"');
    }
    
    
    
    var handlebars = require('handlebars');
    
    var bop;
    var templateObj;
    
    
    return Q.all([
        db.BusinessObjectPackage.findOne({$or:[{_id:pkg}, {key:pkg}]}).lean().exec(),
        db.DocTemplate.findOne({key:'sys.package_doc'})
    ])
    .then(function(resultArr) {
        bop = resultArr[0];
        templateObj = resultArr[1];
        
        res.type(templateObj.content_type || 'txt');
        
        //process the manifest
        var bods = bop.manifest.BusinessObjectDef;
        var bodIds = bods ? Object.keys(bods) : [];
        
        var webServices = bop.manifest.WebService;
        var wsIds = webServices ? Object.keys(webServices) : [];
        
        var dataTriggers = bop.manifest.DataTrigger;
        var dtIds = dataTriggers ? Object.keys(dataTriggers) : [];
        
        var uiActions = bop.manifest.UiAction;
        var uiaIds = uiActions ? Object.keys(uiActions) : [];
        
        var configs = bop.manifest.Config;
        var configIds = configs ? Object.keys(configs) : [];
        
        var customPages = bop.manifest.DbuiCustomPage;
        var cpageIds = customPages ? Object.keys(customPages) : [];
        
        
        
        return Q.all([
            db.BusinessObjectDef.find({_id:{$in:bodIds}}, {class_name:1, doc:1}, {sort:{class_name:1}}).lean().exec(),
            db.WebService.find({_id:{$in:wsIds}}, {path:1, doc:1}, {sort:{path:1}}).lean().exec(),
            db.DataTrigger.find({_id:{$in:dtIds}}, {action:0}, {sort:{key:1}}).lean().exec(),
            db.UiAction.find({_id:{$in:uiaIds}}, {function:0}, {sort:{key:1}}).lean().exec(),
            db.DbuiCustomPage.find({_id:{$in:cpageIds}}, {body:0, controller:0}, {sort:{key:1}}).lean().exec(),
            db.Config.find({_id:{$in:configIds}, key:{$regex:'^sys.dbui.perspective'}}, {key:1}).lean().exec()
        ]);
    })
    .then(function(resultArr) {
        var templateContext = {
            package:bop,
            businessObjectDefs: resultArr[0],
            webServices: resultArr[1],
            dataTriggers: resultArr[2],
            uiActions:resultArr[3],
            customPages:resultArr[4]
        };
        
        var perspectiveToBo = {};
        
        var rex = /^sys\.dbui\.perspective\.([^.]+)\.(.+)/;
        _.forEach(resultArr[5], function(c) {
            var match = rex.exec(c.key);
            if(match) {
                var persp = match[1];
                var boClass = match[2];
                if(!perspectiveToBo[persp]) {
                    perspectiveToBo[persp] = [];
                }
                perspectiveToBo[persp].push(boClass);
            }
        });
        
        var perspectives = [];
        _.forEach(perspectiveToBo, function(boArr, perspectiveName) {
            boArr.sort();
            perspectives.push({
                name:perspectiveName,
                classes:boArr
            })
        });
        templateContext.perspectives = _.sortBy(perspectives, 'name');
        
        
        var template = handlebars.compile(templateObj.content);
        
        return template(templateContext);
    })
    ;
}