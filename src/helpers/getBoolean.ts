function getBoolean(value: string | number | boolean) {
   switch(value){
        case true:
        case "true":
        case "TRUE":
        case 1:
        case "1":
        case "on":
        case "ON":
        case "yes":
        case "YES":
            return true;
        default: 
            return false;
    }
}

export default getBoolean;