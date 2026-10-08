import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Incident from "./incident/Incident";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Preliminary from "../pages/preliminary/Preliminary";
import PreliminaryInvestigation from "../pages/preliminary/DraftPreliminary";
import PreliminaryReview from "../pages/preliminary/PreliminaryReview"; // Add this import
import Layout from "../components/Layout";
import ForensicInvestigation from "../pages/forensic/ForensicInvestigation";
import DraftFraudDetection from "../pages/fraudDetection/DraftFraudDetection";
import DraftFraudPrevention from "../pages/fraudPrevention/DraftFraudPrevention";
import Forensic from "../pages/forensic/Forensic";
import ReviewForensic from "../pages/forensic/ReviewForensic";
import DraftForensic from "../pages/forensic/DraftForensic";
import { Review_Incident } from "./incident/ReviewIncident";
import ReviewFraudPrevention from "./fraudPrevention/ReviewFraudPrevention";
import FraudPrevention from "./fraudPrevention/FraudPrevention";
import FraudDetection from "../pages/fraudDetection/FraudDetection";
import UserManagement from "../pages/userManagement/UserManagement";
import UpdateProfile from "../pages/userManagement/UpdateProfile";
import ReviewFraudDetection from "./fraudDetection/ReviewFraudDetection";
import Home from "../pages/Home";
import NotFound from "./NotFound.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        {/* Protected Routes with Layout */}
        <Route
          path="/incident"
          element={
            <Layout>
              <Incident />
            </Layout>
          }
        />
        <Route
          path="/profile-update"
          element={
            <Layout>
              <UpdateProfile />
            </Layout>
          }
        />
        <Route
          path="/preliminary"
          element={
            <Layout>
              <Preliminary />
            </Layout>
          }
        />
        <Route
          path="/fraud-prevention/review/"
          element={
            <Layout>
              <ReviewFraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/user-management"
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
          path="/forensic/review"
          element={
            <Layout>
              <ReviewForensic />
            </Layout>
          }
        />
        <Route
          path="/prevention-fraud"
          element={
            <Layout>
              <FraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/fraud-detection"
          element={
            <Layout>
              <FraudDetection />
            </Layout>
          }
        />
        <Route
          path="/prevention-fraud/draft/:id"
          element={
            <Layout>
              <DraftFraudPrevention />
            </Layout>
          }
        />
        <Route
          path="/fraud-detection/draft/:id"
          element={
            <Layout>
              <DraftFraudDetection />
            </Layout>
          }
        />

        <Route
        path="/fraud-detection/review"
        element={
          <Layout>
            <ReviewFraudDetection/>
          </Layout>
        }
        />
        <Route
          path="/forensic/draft/:id"
          element={
            <Layout>
              <DraftForensic />
            </Layout>
          }
        />
        {/* Review routes */}
        <Route
          path="/incidents/review"
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
