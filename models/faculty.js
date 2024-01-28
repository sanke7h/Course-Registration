const mongoose=require('mongoose');

const facultyschema=new mongoose.Schema({
    Name:{
        type: String,
        required:true
    },
    Email:{
        type: String,
        required:true
    },
    Department:{
        type: String,
        required:true,
        enum: ['CSE','IT','EEE','ECE','MECH','CV','CH','MI','MT']
    },
    StaffId:{
        type: String,
        required:true
    },
    Password:{
        type: String,
        required:true
    },
    Role:{
        type: String,
        required: true,
        enum:['Faculty Advisor','Course Instructor']
    },
    Courses:[
        {
            schedule: {
                type: String,
                //required:true
            },
            courseId:{
                type: String,
            },
            students: [
                {
                    type: String
                }
            ],
        },
    ],
    flag1:{
        type: Number,
        default: 0
    },
    flag2:{
        type: Number,
        default: 0
    },
    flag3:{
        type: Number,
        default: 0
    }

});

const Faculty=new mongoose.model('Faculty',facultyschema);

module.exports= Faculty;