const bcrypt = require('bcryptjs');

const hashInDatabase = '$2a$10$7R9L8V4Y8Z9Z9Z9Z9Z9Z9uYp1p9v1p9v1p9v1p9v1p9v1p9v1p9'; // Replace with the hash you want to check
const passwordToTest = 'admin123';

bcrypt.compare(passwordToTest, hashInDatabase, (err, result) => {
    if (result) {
        console.log('✅ MATCH: The hash is equal to "admin123"');
    } else {
        console.log('❌ NO MATCH: The hash does NOT match "admin123"');
    }
});
