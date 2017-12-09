function (fieldName) {
    
    var ret = { $nor:[{},{},{},{}]};
    
    ret.$nor[0][fieldName] = {$exists:false};
    ret.$nor[1][fieldName] = '';
    ret.$nor[2][fieldName] = null;
    ret.$nor[3][fieldName] = {$size:0};
    
    return ret;
}