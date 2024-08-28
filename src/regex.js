const email = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
const phoneNumber = "^[0-9]{10}$";
const postalCode = "^[0-9]{5}$";
const url = "^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$";
const date = "^\\d{4}-\\d{2}-\\d{2}$"; 
const time = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$";  
const ipv4 = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
const hexColor = "^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"; 

module.exports = {
    email,
    phoneNumber,
    postalCode,
    url,
    date,
    time,
    ipv4,
    hexColor
};
