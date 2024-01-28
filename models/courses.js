const mongoose=require('mongoose');

const courseschema=new mongoose.Schema({
    Department:{
        type:String,
        required:true,
        enum: ['CSE','IT','EEE','ECE','MECH','CV','CH','MI','MT']
    },
    CourseCode:{
        type: String,
        required:true
    },
    CourseTitle:{
        type: String,
        required:true
    },
    Credits:{
        type: Number,
        required:true
    },
    CourseType:{
        type: String,
        required: true,
        enum:['Mandatory Course','Elective']
    }
});

const Courses=new mongoose.model('Courses',courseschema);

module.exports= Courses;