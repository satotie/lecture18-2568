import { Router, type Request, type Response } from "express";
import {
  zCourseId,
  zStudentId,
} from "../libs/zodValidators.js";

import type { Student, Enrollment } from "../libs/types.js";

// import database
import { enrollments,reset_enrollments,users,students } from "../db/db.js";

//import middlewares
import type { User, CustomRequest, UserPayload } from "../libs/types.js";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddlewares.js";
import { checkAllRole } from "../middlewares/checkAllRoleMiddlewares.js";



const router = Router();

// GET /api/v2/enrollments
router.get("/", authenticateToken,checkRoleAdmin, (req: CustomRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Enrollments Information",
      data: enrollments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});


// POST /api/v2/enrollments/reset
// reset enrollments data to default
router.post("/reset",authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
  try {
    reset_enrollments();
    return res.status(200).json({
      success: true,
      message: "enrollments database has been reset"
    })
  }catch(err){
   return res.status(500).json({
    success: false,      
    message: "Something is wrong, please try again",
    error: err,
  }); 
  }
});

// GET /api/v2/enrollments/{studentId}
// search for enrollments data
router.get("/:studentId",authenticateToken, checkAllRole , (req: CustomRequest, res: Response) => {
  try {
    const studentId = zStudentId.parse(req.params.studentId);
    const user = req.user!;

    if (user.role === "ADMIN" || (user.role === "STUDENT" && user.studentId === studentId)) {
      const studentEnrollments = students.filter(e => e.studentId === studentId);
      return res.status(200).json({
        success: true,
        message: "Student Information",
        data: studentEnrollments,
      });
    }

    return res.status(403).json({
        success: false,
        message: "Forbidden access"
    })

  }catch(err){
   return res.status(500).json({
    success: false,      
    message: "Something is wrong, please try again",
    error: err,
  }); 
  }
});


// POST /api/v2/enrollments/{studentID}, body = {new enrollment data}
// new enrollment
router.post("/:studentId", authenticateToken, checkAllRole, (req: CustomRequest, res: Response) => {
  try {
    const studentId = zStudentId.parse(req.params.studentId);
    const courseId = zCourseId.parse(req.body.courseId);
    const user = req.user!;

    if (user.role === "ADMIN" || (user.role === "STUDENT" && user.studentId !== studentId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden access",
      });
    }

    const isDuplicate = enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
    if(isDuplicate){
      return res.status(409).json({
        success: false,
        message: "studentId && courseId is already exists",
      });
    }

    enrollments.push({ studentId, courseId });

    return res.status(201).json({
      success: true,
      message: `Student ${studentId} & Course ${courseId} has been added successfully`,
      data: { studentId, courseId },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});


// DELETE /api/v2/enrollments/{studentId}, body = {courseId}
router.delete("/:studentId",authenticateToken,checkAllRole,(req:CustomRequest,res:Response)=>{
  try {
    const studentId = zStudentId.parse(req.params.studentId);
    const courseId = zCourseId.parse(req.body.courseId); 
    const user = req.user!;

    if (user.role === "ADMIN" || (user.role === "STUDENT" && user.studentId !== studentId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify another student's data",
      });
    }

    const index = enrollments.findIndex(e => e.studentId === studentId && e.courseId === courseId);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Enrollment does not exist",
      });
    }

    enrollments.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: `Student ${studentId} & Course ${courseId} has been deleted successfully`,
      data: { studentId, courseId },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

export default router;