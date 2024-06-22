const cloudinary = require('cloudinary');

const connectCloudinary =  ()=>{
    try{
         cloudinary.config({
            cloud_name: 'djthwdebh', 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET_KEY, 
        });
        console.log("Cloudinary connected");
    }catch(e){
        console.log("Cloudinary connection error", e);
        process.exit(1);
    }
}

module.exports = connectCloudinary;