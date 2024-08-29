function encrypt(text, key) {
     // Convert the text to JSON string if it's an object
     text = typeof text === "string" ? text : JSON.stringify(text);

     // XOR encryption
     const xorText = text.split('').map((char, index) => {
          return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length));
     }).join('');

     // Convert to a Buffer and encode in Base64
     return Buffer.from(xorText, 'utf8').toString('base64');
}

function decrypt(encodedText, key) {
     // Decode from Base64 to original XOR text
     const decodedText = Buffer.from(encodedText, 'base64').toString('utf8');

     // XOR decryption
     const decryptedText = decodedText.split('').map((char, index) => {
          return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length));
     }).join('');

     // Parse JSON string back to an object if necessary
     try {
          return JSON.parse(decryptedText);
     } catch (e) {
          return decryptedText; // If it's not JSON, return the raw text
     }
}

// Example usage
const obj = {
     "users": {
          "1": {
               "firstName": "John",
               "lastName": "Doe",
               "createdAt": 1724801299479,
               "email": "example@domain.com",
               "groups": {
                    "name": "Admins",
                    "description": "Admin group"
               }
          }
     }
};

const key = "mySecretKey";  // Replace with your key

const _encrypt = encrypt(obj, key);
console.log("Encrypted:", _encrypt);

const _decrypt = decrypt(_encrypt, key);
console.log("Decrypted:", _decrypt);
