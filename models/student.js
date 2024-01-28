const mongoose=require('mongoose');
const Batch=require('../models/batches');

const studentschema=new mongoose.Schema({
    Name:{
        type: String,
        required:true
    },
    BatchId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
    },
    Year:{
        type: Number,
        enum:[1,2,3,4],
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
    Program:{
        type: String,
        required:true,
        enum: ['BTech','MTech','PhD','B.Arch']
    },
    StudentId:{
        type: String,
        required:true
    },
    Password:{
        type: String,
        required:true
    },
    Courses:[
        {
            Instructor:{
                type: String,
            },
            Schedule:{
                type: [String],
            },
            CourseCode:{
                type: String,
            },
            CourseTitle:{
                type: String,
            },
            CourseType:{
                type: String,
                enum:['Mandatory Course','Elective']
            },
            Credits:{
                type: Number,
            }
        }
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

const Student=new mongoose.model('Student',studentschema);

module.exports= Student;