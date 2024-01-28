const mongoose=require('mongoose');
const students=require('./student');
const courses=require('./courses');
const faculty=require('./faculty');

const batcheschema=new mongoose.Schema({
    BatchName:{
        type:String,
        required:true
    },
    BatchYear:{
        type:Number,
        required:true
    },
    BatchProgramme:{
        type:String,
        required:true
    },
    BatchDept:{
        type:String,
        required:true
    },
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
    },
    OpenRegistrationDate:{
        type: Date
    },
    
    Students:[
        {
            type: String
        }
    ],
    
    Courses: [
        {
            schedule: {
                type: String,
                //required:true
            },
            facultyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'faculty',
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
});

const Batches=new mongoose.model('Batches',batcheschema);

module.exports= Batches;