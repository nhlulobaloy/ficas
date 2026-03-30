import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Incident from "./Incident";
import SignUp from "./SignUp";
import Login from "./Login";
import Preliminary from "./Preliminary";
import PreliminaryInvestigation from "./DraftPreliminary";
import PreliminaryReview from "./PreliminaryReview"; // Add this import
import Layout from "./components/Layout";
import ForensicInvestigation from "./ForensicInvestigation";
import DraftFraudDetection from "./DraftFraudDetection";
import DraftFraudPrevention from "./DraftFraudPrevention";
import Forensic from "./Forensic";
import ReviewForensic from "./ReviewForensic";
import DraftForensic from "./DraftForensic";
import { Review_Incident } from "./Review-Incident";
import ReviewFraudPrevention from "./ReviewFraudPrevention";
import FraudPrevention from "./FraudPrevention";
import FraudDetection from "./FraudDetection";
import UserManagement from "./UserManagement";
import UpdateProfile from "./UpdateProfile";
import ReviewFraudDetection from "./ReviewFraudDetection";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Protected Routes with Layout */}
        <Route
          path="/Incident"
          element={
            <Layout>
              <Incident />
            </Layout>
          }
        />
        <Route
          path="/update/profile"
          element={
            <Layout>
              <UpdateProfile />
            </Layout>
          }
        />
        <Route
          path="/Preliminary"
          element={
            <Layout>
              <Preliminary />
            </Layout>
          }
        />
        <Route
          path="/review/fraud/prevention"
          element={
            <Layout>
              <ReviewFraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/user/management"
          element={
            <Layout>
              <UserManagement />
            </Layout>
          }
        />
        <Route
          path="/forensic"
          element={
            <Layout>
              <Forensic />
            </Layout>
          }
        />
        <Route
          path="/review/forensic"
          element={
            <Layout>
              <ReviewForensic />
            </Layout>
          }
        />
        <Route
          path="/fraud/prevention"
          element={
            <Layout>
              <FraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/fraud/detection"
          element={
            <Layout>
              <FraudDetection />
            </Layout>
          }
        />
        <Route
          path="/draft/fraud/prevention/:id"
          element={
            <Layout>
              <DraftFraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/draft/fraud/detection/:id"
          element={
            <Layout>
              <DraftFraudDetection />
            </Layout>
          }
        />

        <Route
        path="fraud/detection/review"
        element={
          <Layout>
            <ReviewFraudDetection/>
          </Layout>
        }
        />
        <Route
          path="/draft/forensic/:id"
          element={
            <Layout>
              <DraftForensic />
            </Layout>
          }
        />
        {/* Review routes */}
        <Route
          path="/review/incidents"
          element={
            <Layout>
              <Review_Incident />
            </Layout>
          }
        />
        <Route
          path="/preliminary/review"
          element={
            <Layout>
              <PreliminaryReview />
            </Layout>
          }
        />{" "}
        {/* Add this */}
        {/* Add this */}
        {/* Investigation routes */}
        <Route
          path="/PreliminaryInvestigation/:incident_id"
          element={
            <Layout>
              <PreliminaryInvestigation />
            </Layout>
          }
        />
        <Route
          path="/ForensicInvestigation/:incident_id"
          element={
            <Layout>
              <ForensicInvestigation />
            </Layout>
          }
        />
        {/* AdminView user management routes */}
        {/* Other module routes */}
        <Route
          path="/consequence"
          element={
            <Layout>
              <h1>Consequence Management</h1>
            </Layout>
          }
        />
        <Route
          path="/fraud-prevention"
          element={
            <Layout>
              <h1>Fraud Prevention</h1>
            </Layout>
          }
        />
        <Route
          path="/fraud-detection"
          element={
            <Layout>
              <h1>Fraud Detection</h1>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
