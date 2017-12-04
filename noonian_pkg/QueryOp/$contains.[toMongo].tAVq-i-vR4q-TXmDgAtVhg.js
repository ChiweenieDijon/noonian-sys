function (fieldName, clause) {
    var ret = {};
    ret[fieldName] = {$regex:clause, $options:'i'};
    return ret;
}