function cleanObject(obj: Record<string, unknown>) {
    const cleanObj: Record<string, unknown> = {};
    const keys = Object.keys(obj);
    for (let i=0; i<keys.length; i+=1) {
        if (obj[keys[i]] !== undefined && obj[keys[i]] !== null) {
            cleanObj[keys[i]] = obj[keys[i]];
        }
    }  
    return cleanObj;
}

export default cleanObject;