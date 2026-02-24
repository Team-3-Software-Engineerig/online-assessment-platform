import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserRoleSelection from './pages/UserRoleSelection';
import RegisterStudent from './pages/RegisterStudent';
import RegisterTeacher from './pages/RegisterTeacher';
import RegisterManager from './pages/RegisterManager';
import TeacherDashboard from './pages/TeacherDashboard';
import Admin from './pages/Admin';
import Instructions from './pages/Instructions';
import Assessment from './pages/Assessment';
import Result from './pages/Result';
import StudentExamList from './pages/StudentExamList';
import CreateExam from "./pages/CreateExam";
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/select-role" replace />} />
          <Route path="/select-role" element={<UserRoleSelection />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/teacher" element={<RegisterTeacher />} />
          <Route path="/register/manager" element={<RegisterManager />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

          <Route path="/teacher/exams/create" element={<CreateExam />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/exam" element={<Assessment />} />
          <Route path="/result" element={<Result />} />
          <Route path="/student/exams" element={<StudentExamList />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
