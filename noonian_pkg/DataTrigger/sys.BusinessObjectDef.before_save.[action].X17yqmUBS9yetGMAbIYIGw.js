function (_) {
    var def = this.definition;
    var doc = this.doc || '';
    
    var regex = /^\s*@property {(.+)}\s*(\S+).*$/;
    
    var foundNames = {};
    
    var lines = doc.split('\n');
    _.forEach(lines, function(line) {
        var result = regex.exec(line);
        console.log(result);
        if(result) {
            foundNames[result[2]] = true;
        }
    });
    
    var fieldsToAdd = [];
    
    _.forEach(def, function(td, fieldName) {
        if(fieldName.indexOf('_') !== 0 && !foundNames[fieldName]) {
            fieldsToAdd.push(fieldName);
        }
    });
    
    if(fieldsToAdd.length) {
        fieldsToAdd.sort();
        doc += '\n';
        
        _.forEach(fieldsToAdd, function(fieldName) {
            var td = def[fieldName];
            var isArray = td instanceof Array;
            if(isArray) {
                td = td[0];
            }
            var type = td.type;
            if(type === 'reference' && td.ref_class) {
                type += '.<'+td.ref_class+'>';
            }
            if(isArray) {
                type += '[]';
            }
            doc += ' @property {'+type+'} '+fieldName+' \n';
        });
        
        this.doc = doc;
    }
    
}