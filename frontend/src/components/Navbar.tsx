import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./NavBar.css";
import axios from "axios";

const NavBar: React.FC = () => {
  interface User {
    name: string,
    email: string,
    role: string
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [showIncidentMenu, setShowIncidentMenu] = useState(false);
  const [showPreliminaryMenu, setShowPreliminaryMenu] = useState(false);
  const [showForensicMenu, setShowForensicMenu] = useState(false);
  const [showConsequenceMenu, setShowConsequenceMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showFraudMenu, setShowFraudMenu] = useState(false);
  const [showFraudDetectionMenu, setShowFraudDetectionMenu] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  const incidentMenuRef = useRef<HTMLDivElement>(null);
  const preliminaryMenuRef = useRef<HTMLDivElement>(null);
  const fraudMenuRef = useRef<HTMLDivElement>(null);
  const fraudDetectionMenuRef = useRef<HTMLDivElement>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem(`token`);

  const getUser = async () => {
    const res = await axios.get(`http://localhost:3000/api/auth/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = res.data.user;
    setUserData(data);
  };

  useEffect(() => {
    getUser()
  }, [token]); // ✅ Runs only when token changes

  const forensicOptions = [
    { name: "Draft Forensic Investigation Report", path: "/Forensic" },
    { name: "Review Forensic Investigation Report", path: "/review/forensic" },
  ];

  const consequenceOptions = [
    { name: "Draft Consequence Management", path: "/Consequence" },
    { name: "Review Consequence Management", path: "/review-consequence" },
  ];

  const fraudPreventionOptions = [
    { name: "Draft Fraud Prevention", path: "/fraud/prevention" },
    { name: "Review Fraud Prevention", path: "/review/fraud/prevention" },
  ];

  const fraudDetectionOptions = [
    { name: "Draft Fraud Detection", path: "/fraud/detection" },
    { name: "Review Fraud Detection", path: "/fraud/detection/review" },
  ];

  const adminOptions = [
    { name: "User & Access Management", path: "/user/management" },
    { name: "Option 2", path: "/AdminView/option2" },
    { name: "Option 3", path: "/AdminView/option3" },
    { name: "Option 4", path: "/AdminView/option4" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("user_id");
    setShowDropdown(false);
    navigate("/");
  };

  const clearMenuTimeout = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  };

  const handleMouseEnterGroup = (
    menuType:
      | "incident"
      | "preliminary"
      | "forensic"
      | "consequence"
      | "admin"
      | "fraud"
      | "fraudDetection",
  ) => {
    clearMenuTimeout();
    setShowIncidentMenu(menuType === "incident");
    setShowPreliminaryMenu(menuType === "preliminary");
    setShowForensicMenu(menuType === "forensic");
    setShowConsequenceMenu(menuType === "consequence");
    setShowAdminMenu(menuType === "admin");
    setShowFraudMenu(menuType === "fraud");
    setShowFraudDetectionMenu(menuType === "fraudDetection");
  };

  const handleMouseLeaveGroup = (
    menuType:
      | "incident"
      | "preliminary"
      | "forensic"
      | "consequence"
      | "admin"
      | "fraud"
      | "fraudDetection",
  ) => {
    menuTimeoutRef.current = setTimeout(() => {
      if (menuType === "incident") setShowIncidentMenu(false);
      else if (menuType === "preliminary") setShowPreliminaryMenu(false);
      else if (menuType === "forensic") setShowForensicMenu(false);
      else if (menuType === "consequence") setShowConsequenceMenu(false);
      else if (menuType === "admin") setShowAdminMenu(false);
      else if (menuType === "fraud") setShowFraudMenu(false);
      else if (menuType === "fraudDetection") setShowFraudDetectionMenu(false);
    }, 300);
  };

  const handleMenuItemClick = (path: string) => {
    setShowIncidentMenu(false);
    setShowPreliminaryMenu(false);
    setShowForensicMenu(false);
    setShowConsequenceMenu(false);
    setShowAdminMenu(false);
    setShowFraudMenu(false);
    setShowFraudDetectionMenu(false);
    navigate(path);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        incidentMenuRef.current &&
        !incidentMenuRef.current.contains(event.target as Node)
      ) {
        setShowIncidentMenu(false);
      }
      if (
        preliminaryMenuRef.current &&
        !preliminaryMenuRef.current.contains(event.target as Node)
      ) {
        setShowPreliminaryMenu(false);
      }
      if (
        fraudMenuRef.current &&
        !fraudMenuRef.current.contains(event.target as Node)
      ) {
        setShowFraudMenu(false);
      }
      if (
        fraudDetectionMenuRef.current &&
        !fraudDetectionMenuRef.current.contains(event.target as Node)
      ) {
        setShowFraudDetectionMenu(false);
      }
    };
    // getUser()
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dash-dashboard">
      <header className="dash-dashboard-header">
        <div className="dash-header-top">
          <div className="dash-system-brand">
            <h1 style={{ fontSize: "30px" }}>FICAS</h1>
            <p className="dash-company-name">Digital Forensics Division, HQ</p>
          </div>

          <nav className="dash-main-navigation">
            <div className="dash-nav-container">
              {/* Incident Management */}
              <div
                className="dash-nav-hover-group"
                ref={incidentMenuRef}
                onMouseEnter={() => handleMouseEnterGroup("incident")}
                onMouseLeave={() => handleMouseLeaveGroup("incident")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Incident Management
                </button>
                {showIncidentMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("incident")}
                    onMouseLeave={() => handleMouseLeaveGroup("incident")}
                  >
                    <button
                      className="dash-nav-hover-item"
                      onClick={() => handleMenuItemClick("/Incident")}
                    >
                      Create Incident
                    </button>
                    <button
                      className="dash-nav-hover-item"
                      onClick={() => handleMenuItemClick("/review/incidents")}
                    >
                      Review Incident
                    </button>
                  </div>
                )}
              </div>

              {/* Preliminary Investigation */}
              <div
                className="dash-nav-hover-group"
                ref={preliminaryMenuRef}
                onMouseEnter={() => handleMouseEnterGroup("preliminary")}
                onMouseLeave={() => handleMouseLeaveGroup("preliminary")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Preliminary Investigation
                </button>
                {showPreliminaryMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("preliminary")}
                    onMouseLeave={() => handleMouseLeaveGroup("preliminary")}
                  >
                    <button
                      className="dash-nav-hover-item"
                      onClick={() => handleMenuItemClick("/Preliminary")}
                    >
                      Draft Preliminary Investigation Report
                    </button>
                    <button
                      className="dash-nav-hover-item"
                      onClick={() => handleMenuItemClick("/preliminary/review")}
                    >
                      Review Preliminary Investigation Report
                    </button>
                  </div>
                )}
              </div>

              {/* Forensic Investigation */}
              <div
                className="dash-nav-hover-group"
                onMouseEnter={() => handleMouseEnterGroup("forensic")}
                onMouseLeave={() => handleMouseLeaveGroup("forensic")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Forensic Investigation
                </button>
                {showForensicMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("forensic")}
                    onMouseLeave={() => handleMouseLeaveGroup("forensic")}
                  >
                    {forensicOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="dash-nav-hover-item"
                        onClick={() => handleMenuItemClick(opt.path)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Consequence Management */}
              <div
                className="dash-nav-hover-group"
                onMouseEnter={() => handleMouseEnterGroup("consequence")}
                onMouseLeave={() => handleMouseLeaveGroup("consequence")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Consequence Management
                </button>
                {showConsequenceMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("consequence")}
                    onMouseLeave={() => handleMouseLeaveGroup("consequence")}
                  >
                    {consequenceOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="dash-nav-hover-item"
                        onClick={() => handleMenuItemClick(opt.path)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fraud Prevention */}
              <div
                className="dash-nav-hover-group"
                ref={fraudMenuRef}
                onMouseEnter={() => handleMouseEnterGroup("fraud")}
                onMouseLeave={() => handleMouseLeaveGroup("fraud")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Fraud Prevention
                </button>
                {showFraudMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("fraud")}
                    onMouseLeave={() => handleMouseLeaveGroup("fraud")}
                  >
                    {fraudPreventionOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="dash-nav-hover-item"
                        onClick={() => handleMenuItemClick(opt.path)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fraud Detection */}
              <div
                className="dash-nav-hover-group"
                ref={fraudDetectionMenuRef}
                onMouseEnter={() => handleMouseEnterGroup("fraudDetection")}
                onMouseLeave={() => handleMouseLeaveGroup("fraudDetection")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Fraud Detection
                </button>
                {showFraudDetectionMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("fraudDetection")}
                    onMouseLeave={() => handleMouseLeaveGroup("fraudDetection")}
                  >
                    {fraudDetectionOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="dash-nav-hover-item"
                        onClick={() => handleMenuItemClick(opt.path)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin */}
              <div
                className="dash-nav-hover-group"
                onMouseEnter={() => handleMouseEnterGroup("admin")}
                onMouseLeave={() => handleMouseLeaveGroup("admin")}
              >
                <button className="dash-nav-link dash-nav-disabled">
                  Admin
                </button>
                {showAdminMenu && (
                  <div
                    className="dash-nav-hover-menu"
                    onMouseEnter={() => handleMouseEnterGroup("admin")}
                    onMouseLeave={() => handleMouseLeaveGroup("admin")}
                  >
                    {adminOptions.map((opt) => (
                      <button
                        key={opt.name}
                        className="dash-nav-hover-item"
                        onClick={() => handleMenuItemClick(opt.path)}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* User info */}
          <div className="dash-user-info-panel">
            <div className="dash-user-details">
              <span className="dash-logged-in-as">logged in as</span>
              <span className="dash-user-name">
                {userData?.name || "User"} <br></br> ({userData?.email}) <br></br>
                {userData?.role}
              </span>
            </div>

            <div className="dash-user-controls">
              <button className="dash-control-btn">Help</button>

              <div className="dash-dropdown-container">
                <button
                  className="dash-menu-toggle"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  ⋮
                </button>

                {showDropdown && (
                  <div className="dash-dropdown-menu">
                    <button
                      className="dash-dropdown-item"
                      onClick={() => navigate("/update/profile")}
                    >
                      Update Profile
                    </button>
                    <button
                      className="dash-dropdown-item"
                      onClick={() => navigate("/change-password")}
                    >
                      Change Password
                    </button>
                    <div className="dash-dropdown-divider" />
                    <button
                      className="dash-dropdown-item dash-logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <button className="home-button" onClick={() => navigate("/forensic")}>
        Home
      </button>
      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default NavBar;
