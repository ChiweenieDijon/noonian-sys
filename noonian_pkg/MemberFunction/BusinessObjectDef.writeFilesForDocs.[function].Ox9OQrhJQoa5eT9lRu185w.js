function (db, nodeRequire, Q, _) {
    var fs = nodeRequire('fs');
    return function(idList, outputDir) {
        if(!idList || !idList.length) {
            return Q(true);
        }
        
        var fieldTypes = {};
        
        return db.BusinessObjectDef.find({_id:{$in:idList}}).sort({class_name:'asc'}).lean().then(function(boList) {
            var outFile = outputDir+'/BusinessObjectDef.js';
            var outputStream = fs.createWriteStream(outFile);
            
            outputStream.write('/**\nBusiness Object Classes\n@namespace BusinessObjects\n**/\n');
            
            _.forEach(boList, function(bod) {
                outputStream.write('/**\n@class\n');
                if(bod.doc) {
                    outputStream.write('@classdesc '+bod.doc+'\n')
                }
                outputStream.write('@memberof BusinessObjects\n');
                outputStream.write('**/\n');
                
                outputStream.write('db.'+bod.class_name+' = function() {\n');
                // _.forEach(memberFunctions, function(mf) {
                // });
                outputStream.write('};\n');
            });
            
            outputStream.end();
            return fieldTypes;
        });
    };
}