const bcrypt = require('bcrypt');



const hashed = bcrypt.hashSync("purple-monkey-dinosaur", 10);
console.log(hashed);