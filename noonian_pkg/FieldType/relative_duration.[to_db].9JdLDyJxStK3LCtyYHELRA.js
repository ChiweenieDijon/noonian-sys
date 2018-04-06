function (value) {
    if(value && (value.date == null)) {
        return null;
    }
    return value;
}