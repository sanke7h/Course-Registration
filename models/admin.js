const mongoose=require('mongoose');

const adminschema=new mongoose.Schema({
    Email:{
        type: String,
        required:true
    },
    Password:{
        type: String,
        required:true
    },
});

const Admin=new mongoose.model('Admin',adminschema);

module.exports= Admin;