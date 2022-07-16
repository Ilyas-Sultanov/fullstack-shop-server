function dateIsValid(dateStr: string): boolean {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  
    if (dateStr.match(regex) === null) {
      return false;
    }
  
    const [day, month, year] = dateStr.split('/');
  
    // 👇️ format Date string as `yyyy-mm-dd`
    const isoFormattedStr = `${year}-${month}-${day}`;
  
    const date = new Date(isoFormattedStr);
    // console.log(date); // 👉️ Invalid Date
  
    const timestamp = date.getTime();
    // console.log(timestamp); // 👉️ NaN
  
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
      // 👇️ this runs
      return false;
    }
  
    return date.toISOString().startsWith(isoFormattedStr);
}

export default dateIsValid;