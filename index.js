const express=require('express');
const app=express();
const mongoose=require('mongoose');
const methodOverride=require('method-override');
const bcrypt=require('bcrypt');
const session=require('express-session');
const schedule = require('node-schedule');

const url='mongodb+srv://nssanketh:Sanketh770@cluster1.tbyxp9a.mongodb.net/?retryWrites=true&w=majority';
const url2='mongodb+srv://nssanketh:Sanketh770@cluster1.tbyxp9a.mongodb.net/';


const Student=require('./models/student');
const Course=require('./models/courses');
const Faculty=require('./models/faculty');
const Batch=require('./models/batches');
const Admin=require('./models/admin');

mongoose.connect('mongodb://127.0.0.1:27017/Irisdb',{useNewUrlParser:true,useUnifiedTopology:true});
//mongoose.connect(url,{useNewUrlParser:true,useUnifiedTopology:true});
const db=mongoose.connection;
db.on('error',console.error.bind(console,"Mongoose Connection Error:"));
db.once('open',()=>{
    console.log("Connection to database established")
});

app.listen(3000,()=>{
    console.log("Listening on port 3000");
});

app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(session({secret:'notthewaytoaddsecret',resave:false,saveUninitialized:false}));

const requirelogin=(req,res,next)=>{
    if(!req.session.userid){
        return res.redirect('/login');
    }
    else{
        next();
    }
}


const removeStudentFromFaculty = async (facultyId, courseId, studentId) => {
    const faculty = await Faculty.findById(facultyId);
    if (faculty) {
      const course = faculty.Courses.find(c => c.courseId === courseId);
      if (course) {
        course.students.pull(studentId);
        await faculty.save();
      }
    }
};

const removeCourseFromStudent = async (studentId, courseId) => {
    const student = await Student.findOne({ StudentId: studentId });
    if (student) {
      student.Courses = student.Courses.filter(c => c.CourseCode !== courseId);
      await student.save();
    }
};

const removeStudentFromBatchCourse = async (batchId, courseId, studentId) => {
    const batch = await Batch.findById(batchId);
    if (batch) {
      const course = batch.Courses.find(c => c.courseId === courseId);
      if (course) {
        course.students.pull(studentId);
        await batch.save();
      }
    }
  };
  
  

app.get('/',(req,res)=>{
    res.render("HomePage");
})

app.get('/loginfail',(req,res)=>{
    res.send("Invalid Credentials")
})

app.get('/adminlogin',(req,res)=>{
    res.render('adminlogin');
})

app.post('/adminlogin',async(req,res)=>{
    const {Email,Password}=req.body;
    const user= await Admin.findOne({Email});
    if(user==null){
        return res.redirect('/loginfail');
    }
    const result=await bcrypt.compare(Password,user.Password);
    if(result){
        req.session.adminid=true;
        return res.redirect('/admin');
    }
    else{
        res.redirect('/loginfail');
    }
})

app.get('/signup',async(req,res)=>{
    if(!req.session.userid){
        return res.render('student_signup');
    }
    else{
        res.redirect('/register');
    }
})

app.post('/signup',async(req,res)=>{
    const hashed= await bcrypt.hash(req.body.Password,12);
    req.body.Password=hashed;
    await Student.insertMany([req.body]);
    const user= await Student.findOne({Email:req.body.Email});
    req.session.userid=user._id;
    res.redirect('/profile');
})

app.get('/login',(req,res)=>{
    if(!req.session.userid){
        return res.render('login');
    }
    else{
        res.redirect('/profile');
    }
})

app.post('/student/login',async(req,res)=>{
    const {Email,Password}=req.body;
    const user= await Student.findOne({Email});
    if(user==null){
        return res.redirect('/loginfail');
    }
    const result=await bcrypt.compare(Password,user.Password);
    if(result){
        req.session.userid=user._id;
        res.redirect('/profile');
    }
    else{
        res.redirect('/loginfail');
    }
})

app.post('/logout',async(req,res)=>{
    req.session.adminid=null;
    req.session.userid=null;
    req.session.role=null;
    req.session.dept=null;
    req.session.fid=null;
    req.session.adminid=null;
    res.redirect('/');
})

app.get('/facultylogin',async(req,res)=>{
    res.render('facultylogin');
})

app.post('/facultylogin',async(req,res)=>{
    const {Email,Password}=req.body;
    const user= await Faculty.findOne({Email});
    if(user==null){
        return res.redirect('/loginfail');
    }
    const result=await bcrypt.compare(Password,user.Password);
    if(result){
        req.session.role=user.Role;
        req.session.dept=user.Department;
        req.session.fid=user.StaffId;
        if(req.session.role=='Faculty Advisor'){
            res.redirect('/faculty_advisor/profile');
        }
        else if(req.session.role=='Course Instructor'){
            return res.redirect('/course_instructor/profile');
        }
    }
    else{
        res.redirect('/loginfail');
    }
})

app.get('/tryout',async(req,res)=>{
    const batch=await Batch.findOne({BatchDept:'IT'})

    console.log(batch);
    res.send("Trying");
})

app.get('/addcourse',(req,res)=>{
    if(req.session.adminid){
        res.render("addcourse");
    }
    else{
        res.send("U are not authorised to view this page");
    }
})

app.post('/addcourse',async(req,res)=>{
    await Course.insertMany([req.body]);
    res.redirect('/admin');
})

app.get('/addfaculty',(req,res)=>{
    if(req.session.adminid){
        res.render("addfaculty");
    }
    else{
        res.send("U are not authorised to view this page");
    }
})

app.post('/addfaculty',async(req,res)=>{
    //console.log(req.body);
    const hashed= await bcrypt.hash(req.body.Password,12);
    req.body.Password=hashed;
    await Faculty.insertMany([req.body]);
    return res.redirect('/admin');
})

app.get('/addbatch',async(req,res)=>{
    if(req.session.role!="Faculty Advisor"){
        return res.send("Unauthorised to access this page");
    }
    else{
        const courses=await Course.find({Department:req.session.dept});
        res.render("addbatch",{courses});
    }
})

app.post('/addbatch',async(req,res)=>{
    const Year=req.body.Year;
    const Program=req.body.Program;
    const BatchName=req.body.BatchName;

    const BatchDept=req.session.dept;
    
    const students=await Student.find({Year:Year,Program:Program});
    let studentId=[];
    for(let s of students){
        studentId.push(s.StudentId);
    }

    let courses=req.body.course;

    let Courses=[];

    for(let c of courses){
        let course =await Course.findOne({CourseTitle:c});
        Courses.push({
            //students: studentId,
            courseId: course.CourseCode
        })
    }
    const batch=new Batch({
        BatchName:BatchName,
        BatchYear:Year,
        BatchDept: BatchDept,
        BatchProgramme:Program,
        Students: studentId,
        Courses: Courses
    })
    await batch.save();

    app.locals.batchname=BatchName;
    app.locals.year=Year;
    app.locals.Department=BatchDept;
    app.locals.Program=Program;

    let courseid_set=[];
    for(let c of batch.Courses){
        courseid_set.push(c.courseId);
    }
    const courses_set=[];
    for(let c of courseid_set){
        let d=await Course.find({CourseCode:c})
        courses_set.push(d);
    }
    let e=await Faculty.find({Department:req.session.dept});

    res.render('addbatch_page2',{courses_set,e});
})

app.post('/addbatch_page2',async(req,res)=>{
    const BatchName=app.locals.batchname;
    const BatchYear=app.locals.year;
    const BatchDept=app.locals.Department;
    const BatchProgramme=app.locals.Program;

    // adding batch..process begins
    const batch=await Batch.findOne({BatchProgramme:BatchProgramme,BatchDept:BatchDept,BatchYear:BatchYear,BatchName:BatchName})

    const { CourseCode, schedule, facultyId } = req.body;
    const coursesMapping = CourseCode.reduce((acc, code, index) => {
        acc[code] = { facultyId: facultyId[index], schedule: schedule[index] };
        return acc;
    }, {});

    batch.Courses.forEach((course) => {
        const { courseId } = course;
        if (coursesMapping[courseId]) {
          course.facultyId = coursesMapping[courseId].facultyId;
          course.schedule = coursesMapping[courseId].schedule;
        }
      });
    batch.save();
    //adding batch...process ends


    //adding corresponding courses to faculties....begin

    for (const course of batch.Courses) {
        const facultyId = course.facultyId;
  
        const faculty = await Faculty.findById(facultyId);
  
        if (faculty) {
          faculty.Courses.push({
            schedule: course.schedule,
            courseId: course.courseId,
            students: course.students,
          });
  
          await faculty.save();
        }
    }
     //adding corresponding courses to faculties....ends
  

    res.redirect('/faculty_advisor/profile');
})

app.get('/addci',(req,res)=>{
    if(req.session.role!="Faculty Advisor"){
        return res.send("Unauthorised to access this page");
    }
    else{
        res.render('addci');
    }
})

app.post('/addci',async(req,res)=>{
    const hashed= await bcrypt.hash(req.body.Password,12);
    req.body.Password=hashed;
    req.body.Role='Course Instructor';
    req.body.Department=req.session.dept;
    //res.send("Wait");
    await Faculty.insertMany([req.body]);
    return res.redirect('/faculty_advisor/profile');
})

app.get('/allbatches',async(req,res)=>{
    if(req.session.role!='Faculty Advisor'){
        return res.send("Unauthorised to access this page");
    }
    else{
    const dept=req.session.dept;
    const batches=await Batch.find({BatchDept:dept});
    res.render('batch',{batches});
    }
})

app.get('/batch/:id',async(req,res)=>{
    if(req.session.role!='Faculty Advisor'){
        return res.send("Unauthorised to access this page");
    }
    else{
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    const flag1=batch.flag1;

    

    if(flag1==0 ||flag1==1){
        const students = await Student.find({ StudentId: { $in: batch.Students } });

        const courseDetails = await Course.find({ CourseCode: { $in: batch.Courses.map(course => course.courseId) } });

    const formattedData = {
      BatchName: batch.BatchName,
      BatchYear: batch.BatchYear,
      BatchProgramme: batch.BatchProgramme,
      Students: students.map(student => ({ StudentId: student.StudentId, Name: student.Name })),
      Courses: courseDetails.map(course => ({ CourseCode: course.CourseCode, CourseTitle: course.CourseTitle })),
    };
        res.render('batchdetails', { formattedData,batch,flag1});
    }
    
    else{
        const getStudentDetails = async (studentNo) => {
            const student = await Student.findOne({ StudentId: studentNo });
            if (student) {
              return {
                StudentNo: student.StudentId,
                StudentName: student.Name,
              };
            }
            return null; 
          };
          
          const getCourseDetails = async (courseId) => {
            const course = await Course.findOne({CourseCode:courseId });
            if (course) {
              return {
                courseId: course.CourseCode,
                courseTitle: course.CourseTitle,
              };
            }
            return null; 
          };
          
          const formattedData = {
            BatchName: batch.BatchName,
            BatchYear: batch.BatchYear,
            BatchProgramme: batch.BatchProgramme,
            Courses: [],
          };
          
          for (const course of batch.Courses) {
            const courseDetails = await getCourseDetails(course.courseId);
          
            if (courseDetails) {
              const studentsDetails = [];
              
              for (const studentNo of course.students) {
                const studentDetails = await getStudentDetails(studentNo);
                if (studentDetails) {
                  studentsDetails.push(studentDetails);
                }
              }
          
              formattedData.Courses.push({
                courseId: courseDetails.courseId,
                courseTitle: courseDetails.courseTitle,
                students: studentsDetails,
              });
            }
          }
       
        res.render('batchdetails',{formattedData,batch,flag1});
    }
}
})

app.get('/faculty_advisor/profile',async(req,res)=>{
    if(req.session.role!='Faculty Advisor'){
        return res.send("Unauthorised to access this page");
    }
    else{
        const faculty= await Faculty.findOne({StaffId:req.session.fid});
        res.render("facultyadvisor",{faculty});
    }
})

app.get('/course_instructor/profile',async(req,res)=>{
    if(req.session.role!='Course Instructor'){
        return res.send("Unauthorised to access this page");
    }
    else{
        const faculty= await Faculty.findOne({StaffId:req.session.fid});
        res.render("course_instructor",{faculty});
    }
})

app.post('/start_registration',async(req,res)=>{
    console.log("Starting Registrations");
    const BatchId=req.body.BatchId;
    const openRegistrationDate = new Date();

    await Batch.findByIdAndUpdate(BatchId, { OpenRegistrationDate: openRegistrationDate,flag1:1});

    // Find the batch
    const batch = await Batch.findById(BatchId);

    // Update each student in the batch
    for (let studentId of batch.Students) {
      await Student.findOneAndUpdate({StudentId:studentId}, {
        BatchId: BatchId,
        flag1: 1,
      });
    }

    schedule.scheduleJob(new Date(Date.now() + 5 * 60 * 1000), async () => {
    
        // Update flag1 to 2
        await Batch.findByIdAndUpdate(BatchId, { flag1: 2 });
    
      });

    res.redirect('/allbatches');
})

app.get('/register',async(req,res)=>{
    if(!req.session.userid){
        return res.send("Unauthorised to access this page");
    }
    else{
    const user= await Student.findById(req.session.userid);
    if(user.flag1==0){
        res.send("Course Registration Hasnt Begun Yet ");
    }
    
    
    else if(user.flag1==1){
        const batchId=user.BatchId;
        const batch=await Batch.findById(batchId);
        const openRegistrationDate = batch.OpenRegistrationDate;

        const currentTime = new Date();
        const timeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds

       const courses=batch.Courses;
       let coursesInfo=[];
       for(let c of courses){
        let id=c.courseId;
        let schedule=c.schedule;
        let course=await Course.findOne({CourseCode:id});
        let credits=course.Credits;
        let coursetype=course.CourseType;
        let coursetitle=course.CourseTitle;
        let object={
            CourseTitle:coursetitle,
            CourseType:coursetype,
            Credits:credits,
            schedule:schedule,
            CourseCode:id
        }
        coursesInfo.push(object);
       }
       console.log(coursesInfo);
        if (currentTime - openRegistrationDate <= timeLimit) {
            res.render('reg_form',{coursesInfo});
        }
        else {
            res.send('Exceeded Time Limit');
        }
    }
    else if(user.flag1==2){
        res.redirect('/courses');
    }
}
})

app.post('/register',async(req,res)=>{
    const courseCodes=req.body.selectedCourses;
    const user= await Student.findById(req.session.userid);
    const id=user.BatchId;
    const batch=await Batch.findById(id);
    const StudentId=user.StudentId;

    batch.Courses.forEach(course => {
        if (courseCodes.includes(course.courseId)) {
          course.students.push(StudentId);
        }
    });

    for (const course of batch.Courses) {
        const facultyid = course.facultyId;
        const faculty = await Faculty.findById(facultyid);

        for (const facultyCourse of faculty.Courses) {
            if (courseCodes.includes(facultyCourse.courseId)) {
                facultyCourse.students.push(StudentId);
            }
        }

        await faculty.save(); // Save faculty changes inside the outer loop
    }

    await batch.save();
    const student= await Student.findById(req.session.userid);

    for (const courseCode of courseCodes) {
        const batchCourse = batch.Courses.find(c => c.courseId === courseCode);

            if (batchCourse) {
                const { facultyId, schedule } = batchCourse;

                const faculty = await Faculty.findById(facultyId);
                const reqd= await Course.findOne({CourseCode:courseCode});

                const Credits=reqd.Credits;
                const CourseType=reqd.CourseType;
                const CourseTitle=reqd.CourseTitle;

                if (!faculty) {
                    return res.status(404).send(`Faculty not found for facultyId ${facultyId}`);
                }

                const instructor = faculty.Name;

                // Update the Courses array in the student object
                student.Courses.push({
                    Instructor: instructor,
                    Schedule: schedule,
                    CourseCode: courseCode,
                    CourseTitle: CourseTitle,
                    CourseType: CourseType,
                    Credits: Credits
                });
                student.flag1=2;
            } 
    }
    await student.save();
    res.redirect("/profile");
})


app.get('/profile',requirelogin,async(req,res)=>{
    if(!req.session.userid){
        return res.send("Unauthorised to access this page");
    }
    else{
    const user= await Student.findById(req.session.userid);
    res.render("profile",{user});
    }
})

app.get('/admin',(req,res)=>{
    if(req.session.adminid){
    res.render("admin");
    }
    else{
        res.send("U are not authorised to view this page");
    }
})

app.get('/mycourses',async(req,res)=>{
    if(req.session.fid){
    const facultyId = req.session.fid; 
    const faculty=await Faculty.findOne({StaffId:facultyId});

    // Create an array to store course information
    const coursesInfo = [];

    // Iterate over each course in the faculty's Courses array
    for (const course of faculty.Courses) {
        // Find the corresponding course in the Course model
        const courseDetails = await Course.findOne({ CourseCode: course.courseId });

        if (courseDetails) {
            // Extract relevant information from the courseDetails
            const { CourseType, CourseTitle, Credits } = courseDetails;

            // Push the information to the coursesInfo array
            coursesInfo.push({
                courseId: course.courseId,
                schedule: course.schedule,
                CourseType: CourseType,
                CourseTitle: CourseTitle,
                Credits: Credits
            });
        } else {
            console.log(`Course with CourseCode ${course.courseId} not found in the Course model`);
        }
    }
    res.render('mycourses', { coursesInfo });
}
    else{
        res.send("No access");
    }
  
})

app.get('/courses',async(req,res)=>{
    if(req.session.userid){
        const student = await Student.findById(req.session.userid);

      if (!student) {
        return res.status(404).send('Student not found');
       }

    const courses = student.Courses.map(course => ({
      Instructor: course.Instructor,
      Schedule: course.Schedule,
      CourseTitle: course.CourseTitle,
      CourseCode: course.CourseCode,
      Credits: course.Credits,
      CourseType: course.CourseType,
    }));

        res.render("Courses",{courses});
    }
    else{
        res.send("Unauthorized");
    }
})

app.get('/coursedetails',async(req,res)=>{
    if(req.session.fid){
    const courseId = req.query.CourseCode;
    const schedule=req.query.Schedule;

        // Find the course using the courseId
        const course = await Course.findOne({ CourseCode: courseId });

        if (!course) {
            return res.status(404).send('Course not found');
        }

        // Fetch additional information for the course
        const { CourseType, CourseTitle, Credits } = course;

        // Get a list of students for the course
        const students = await Student.find({ 'Courses.CourseCode': courseId }, 'Name StudentId');

        // Render the EJS template with the required information
        res.render('coursedetails', {
            courseId,
            schedule,
            CourseType,
            CourseTitle,
            Credits,
            students
        });
    }
    else{
        res.send("Unauthorized");
    }
})

app.post('/delete',async(req,res)=>{
    const { studentId, courseId } = req.body;
    const facultyid=req.session.fid;

    const student = await Student.findOne({ StudentId: studentId });
    const batchId=student.BatchId;

    const faculty = await Faculty.findOne({ StaffId: facultyid });
    const facultyId=faculty._id;

    await removeStudentFromFaculty(facultyId, courseId, studentId);
    await removeCourseFromStudent(studentId, courseId);
    await removeStudentFromBatchCourse(batchId, courseId, studentId);

    res.redirect('/mycourses');

})

app.post('/deleteStudent',async(req,res)=>{
    const {BatchId,studentNo,courseId}=req.body;
    const batch = await Batch.findById(BatchId);

    const course = batch.Courses.find(c => c.courseId === courseId);
    if (course) {
        // Remove the student from the course
        course.students.pull(studentNo);
        const facultyid=course.facultyId;
        const faculty = await Faculty.findById(facultyid);

        const facultyCourse = faculty.Courses.find(fc => fc.courseId === courseId);
          facultyCourse.students.pull(studentNo);

          // Save the faculty
          await faculty.save();

        // Save the batch
        await batch.save();

    }
    const student = await Student.findOne({ StudentId: studentNo });

        if (student) {
          // Remove the course from the student's Courses array
          const studentCourseIndex = student.Courses.findIndex(c => c.CourseCode === courseId);
          if (studentCourseIndex !== -1) {
            student.Courses.splice(studentCourseIndex, 1);
            await student.save();
          }
        }
    res.redirect('/faculty_advisor/profile'); // Redirect to the batch details page
})
