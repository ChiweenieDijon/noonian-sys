function (value) {
    if(value && (value.number == null)) {
        return null;
    }
    return value;
}