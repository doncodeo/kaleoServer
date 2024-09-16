const cloudinary = require('cloudinary').v2;
          
cloudinary.config({ 
  cloud_name: 'drj4s7rgw', 
  api_key: '572966666949658', 
  api_secret: 'JRn6qP5wAohz-e3OOt9VxBIqeew' 
});

module.exports = cloudinary;