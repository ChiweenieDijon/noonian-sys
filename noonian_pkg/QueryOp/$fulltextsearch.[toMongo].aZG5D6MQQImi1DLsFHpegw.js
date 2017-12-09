function (searchStr, typeDescMap, FieldTypeService) {

    var retCond = {$or:[
        {__disp:{$regex:searchStr, $options:'i'}},
        {__match_text:{$regex:searchStr, $options:'i'}}
    ]};
    var condList = retCond.$or;

    for(var fieldName in typeDescMap) {
        var td = typeDescMap[fieldName];
        if(fieldName.indexOf('_') === 0)
            continue;
        
        if(td instanceof Array) {
            td = td[0];
        }

        var mongoType = FieldTypeService.getSchemaElem(td);

        if(!mongoType) {
          console.log("No typeMapper for "+td.type+" field "+fieldName);
          continue;
        }
        var newCond;
        if(mongoType.textIndex) {
            newCond = {};
            newCond[fieldName] = {$regex:searchStr, $options:'i'};
            condList.push(newCond);
        }
        else if(td.type === 'reference') {
            newCond = {};
            newCond[fieldName+'._disp'] = {$regex:searchStr, $options:'i'};
            condList.push(newCond);
        }

    }
    
    return retCond;
}