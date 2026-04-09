/* ForensicReview.tsx */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PreliminaryReview.css";

interface ForensicComment {
  id: number;
  forensic_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

interface ForensicInvestigation {
  id: number;
  incident_id: number;
  preliminary_id: number;
  background: string;
  abbreviations: string;
  annexures: string;
  individuals_featured: string;
  mandate: string;
  purpose_and_objective: string;
  scope_of_investigation: string;
  restrictions_and_limitations: string;
  legislative_policy_framework: string;
  investigation: string;
  interviews: string;
  financial_exposure: string;
  findings: string;
  recommendations: string;
  general: string;
  status: "draft" | "review" | "approved" | "closed";
  conducted_by: string;
  updated_at: string;
  referred_department: number | null;
  created_at: string;
  comments?: ForensicComment[];
}

interface Investigator {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

export default function ReviewForensic() {
  const [investigations, setInvestigations] = useState<ForensicInvestigation[]>(
    [],
  );
  const [filteredInvestigations, setFilteredInvestigations] = useState<ForensicInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvestigation, setSelectedInvestigation] = useState<ForensicInvestigation | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComments, setReturnComments] = useState("");
  const [managementAction, setManagementAction] = useState<"assign_investigator" | "close_case" | "refer_department" | "return" | "" >("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemPerPage] = useState<number>(10);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const verifyAccess = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/forensic/auth/access",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.status === 401) {
        navigate("/login");
        return false;
      }
      if (res.status === 403) {
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  const fetchInvestigators = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/forensic/case/investigators",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setInvestigators(data.data || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const allowed = await verifyAccess();
      if (!allowed) return;

      const res = await fetch(
        `http://localhost:3000/api/forensic/case/review?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setInvestigations(data.data || []);
      setFilteredInvestigations(data.data || []);//pagination
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const depRes = await fetch(
        "http://localhost:3000/api/preli/departments",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const departmentsData = await depRes.json();
      setDepartments(departmentsData.data || departmentsData || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchInvestigations();
    fetchDepartments();
    fetchInvestigators();
  }, [token, currentPage]);

  useEffect(() => {
    let filtered = investigations;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.background?.toLowerCase().includes(s) ||
          item.mandate?.toLowerCase().includes(s) ||
          item.id?.toString().includes(searchTerm) ||
          item.preliminary_id?.toString().includes(searchTerm),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    setFilteredInvestigations(filtered);
  }, [searchTerm, statusFilter, investigations]);

  useEffect(() => {
    if (managementAction !== "refer_department") {
      setSelectedDepartment("");
    }
  }, [managementAction]);

  const handleCloseCase = async (id: number) => {
    const userName = localStorage.getItem("name") || "User";
    try {
      const res = await fetch(`http://localhost:3000/api/forensic/close/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "closed", conducted_by: userName }),
      });
      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: "closed", conducted_by: userName }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setManagementAction("");
        setSessionMessage("Case closed successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const handleReferDepartment = async (id: number) => {
    if (!selectedDepartment) {
      setSessionMessage("Please select a department");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }
    try {
      const selectedDept = departments.find(
        (dept) => dept.id === parseInt(selectedDepartment),
      );
      const res = await fetch(`http://localhost:3000/api/forensic/refer/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referred_department: selectedDept?.id || selectedDepartment,
          status: "approved",
          recommendations: "refer",
        }),
      });
      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                ...i,
                status: "approved",
                referred_department:
                  selectedDept?.id || parseInt(selectedDepartment),
              }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setManagementAction("");
        setSelectedDepartment("");
        setSessionMessage("Case referred successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const handleAssignInvestigator = async (investigationId: number) => {
    // Find the selected investigator object
    const selectedInv = investigators.find(
      (inv) => inv.id.toString() === selectedInvestigator
    );

    if (!selectedInv) {
      setSessionMessage("Please select a valid investigator");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }

    try {
      console.log("Sending assignment:", {
        assigned_to: selectedInv.id,
        assigned_investigator_name: selectedInv.name,
        status: "review",
      });

      const res = await fetch(
        `http://localhost:3000/api/forensic/case/assign/${investigationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assigned_to: selectedInv.id,
            assigned_investigator_name: selectedInv.name,
            status: "review",
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        setSessionMessage(errorData.message || "Failed to assign investigator");
        return;
      }

      // Update state to reflect the assigned investigator
      setInvestigations((prev) =>
        prev.map((i) =>
          i.id === investigationId
            ? {
              ...i,
              conducted_by: selectedInv.name,
              status: "approved",
            }
            : i
        )
      );

      setSelectedInvestigation(null);
      setManagementAction("");
      setSelectedInvestigator("");
      setSessionMessage("Investigator assigned successfully");
      setTimeout(() => setSessionMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };



  const handleReturnToInvestigator = async () => {
    if (!selectedInvestigation || !returnComments.trim()) {
      setSessionMessage("Please provide comments for return");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/forensic/return/${selectedInvestigation.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comments: returnComments,
            status: "returned",
          }),
        },
      );
      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === selectedInvestigation.id
              ? {
                ...i,
                status: "review",
                comments: [
                  ...(i.comments || []),
                  {
                    comment: returnComments,
                    user_name: localStorage.getItem("name") || "User",
                    id: Date.now(),
                    forensic_id: i.id,
                    user_id: 0,
                    created_at: new Date().toISOString(),
                  },
                ],
              }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setShowReturnModal(false);
        setReturnComments("");
        setManagementAction("");
        setSessionMessage("Case returned successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "status-draft";
      case "review":
        return "status-review";
      case "approved":
        return "status-approved";
      case "closed":
        return "status-closed";
      default:
        return "";
    }
  };

  const handleView = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/forensic/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedInvestigation(data.data);
        setManagementAction("");
        setSelectedDepartment("");
      }
    } catch (err) {
      console.error("Error fetching investigation:", err);
    }
  };

  const handleApplyAction = () => {
    if (!selectedInvestigation || !managementAction) return;
    switch (managementAction) {
      case "close_case":
        handleCloseCase(selectedInvestigation.id);
        break;
      case "refer_department":
        handleReferDepartment(selectedInvestigation.id);
        break;
      case "return":
        setShowReturnModal(true);
        break;
      case "assign_investigator":
        handleAssignInvestigator(selectedInvestigation.id);
        break;
      default:
        break;
    }
  };

  // =================== RENDER JSX ===================
  if (loading) return <div className="loading">Loading...</div>;
  if (!investigations.length)
    return <div className="no-data">No forensic investigations found</div>;
  return (
    <div className="preliminary-review-container">
      {sessionMessage && (
        <div className="session-message">{sessionMessage}</div>
      )}
      <h2 className="dashboard-title">Forensic Review</h2>

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by ID, preliminary ID, background..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <>
        <table>
          <thead>
            <tr>
              <th>Preliminary ID</th>
              <th>Recommendations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigations.map((i) => (
              <tr key={i.id}>

                <td>{i.preliminary_id}</td>
                <td>{i.recommendations || "N/A"}</td>
                <td>
                  <span className={`status-badge ${getStatusColor(i.status)}`}>
                    {i.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleView(i.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (

          <div className="pagination">
            <button onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
            >

              Next
            </button>
          </div>
        )}
      </>
      {selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Forensic Investigation Details</h3>
            <button
              className="close-btn"
              onClick={() => {
                setSelectedInvestigation(null);
                setManagementAction("");
                setSelectedDepartment("");
              }}
            >
              ×
            </button>

            <div className="details-grid">
              <div>
                <strong>ID:</strong> {selectedInvestigation.id}
              </div>
              <div>
                <strong>Preliminary ID:</strong>{" "}
                {selectedInvestigation.preliminary_id}
              </div>
              <div>
                <strong>Status:</strong> {selectedInvestigation.status}
              </div>
              <div>
                <strong>Conducted By:</strong>{" "}
                {selectedInvestigation.conducted_by || "N/A"}
              </div>
              <div>
                <strong>Created At:</strong>{" "}
                {new Date(selectedInvestigation.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Updated At:</strong>{" "}
                {new Date(selectedInvestigation.updated_at).toLocaleString()}
              </div>

              <div>
                <strong>Background:</strong>{" "}
                {selectedInvestigation.background || "Not provided"}
              </div>
              <div>
                <strong>Abbreviations:</strong>{" "}
                {selectedInvestigation.abbreviations || "Not provided"}
              </div>
              <div>
                <strong>Mandate:</strong>{" "}
                {selectedInvestigation.mandate || "Not provided"}
              </div>
              <div>
                <strong>Purpose & Objective:</strong>{" "}
                {selectedInvestigation.purpose_and_objective || "Not provided"}
              </div>
              <div>
                <strong>Scope of Investigation:</strong>{" "}
                {selectedInvestigation.scope_of_investigation || "Not provided"}
              </div>
              <div>
                <strong>Restrictions & Limitations:</strong>{" "}
                {selectedInvestigation.restrictions_and_limitations ||
                  "Not provided"}
              </div>
              <div>
                <strong>Legislative Framework:</strong>{" "}
                {selectedInvestigation.legislative_policy_framework ||
                  "Not provided"}
              </div>
              <div>
                <strong>Investigation:</strong>{" "}
                {selectedInvestigation.investigation || "Not provided"}
              </div>
              <div>
                <strong>Interviews:</strong>{" "}
                {selectedInvestigation.interviews || "Not provided"}
              </div>
              <div>
                <strong>Financial Exposure:</strong>{" "}
                {selectedInvestigation.financial_exposure || "Not provided"}
              </div>
              <div>
                <strong>Findings:</strong>{" "}
                {selectedInvestigation.findings || "Not provided"}
              </div>
              <div>
                <strong>Recommendations:</strong>{" "}
                {selectedInvestigation.recommendations || "Not provided"}
              </div>
              <div>
                <strong>General:</strong>{" "}
                {selectedInvestigation.general || "Not provided"}
              </div>
              <div>
                <strong>Individuals Featured:</strong>{" "}
                {selectedInvestigation.individuals_featured || "Not provided"}
              </div>
              <div>
                <strong>Annexures:</strong>{" "}
                {selectedInvestigation.annexures || "Not provided"}
              </div>
              {selectedInvestigation.referred_department && (
                <div>
                  <strong>Referred Department ID:</strong>{" "}
                  {selectedInvestigation.referred_department}
                </div>
              )}

              {(selectedInvestigation.comments || []).length > 0 && (
                <div className="comments-section">
                  <strong>Comments:</strong>
                  <ul>
                    {(selectedInvestigation.comments || []).map((c) => (
                      <li key={c.id}>
                        <strong>{c.user_name}:</strong> {c.comment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {selectedInvestigation.status === "review" && (
              <div className="action-section">
                <div className="assignment-grid">
                  <div className="assignment-item">
                    <label htmlFor="managementAction">Management Action:</label>
                    <select
                      id="managementAction"
                      value={managementAction}
                      onChange={(e) =>
                        setManagementAction(e.target.value as any)
                      }
                    >
                      <option value="">-- Select Action --</option>
                      <option value="close_case">Close Case</option>
                      <option value="refer_department">
                        Refer to Department
                      </option>
                      <option value="return">Return to Investigator</option>
                      <option value="assign_investigator">
                        Assign Investigator
                      </option>{" "}
                      {/* <-- ADD HERE */}
                    </select>
                  </div>

                  {managementAction === "refer_department" && (
                    <div className="assignment-item">
                      <label htmlFor="department">Select Department:</label>
                      <select
                        id="department"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {managementAction === "assign_investigator" && (
                    <div className="assignment-item">
                      <label>Select Investigator:</label>
                      <select
                        value={selectedInvestigator}
                        onChange={(e) =>
                          setSelectedInvestigator(e.target.value)
                        }
                      >
                        <option value="">-- Select Investigator --</option>
                        {investigators.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-buttons">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setSelectedInvestigation(null);
                      setManagementAction("");
                      setSelectedDepartment("");
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="update-btn"
                    onClick={handleApplyAction}
                    disabled={
                      !managementAction ||
                      (managementAction === "refer_department" &&
                        !selectedDepartment)
                    }
                  >
                    Apply Action
                  </button>
                </div>
              </div>
            )}

            {selectedInvestigation.status !== "review" && (
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setSelectedInvestigation(null);
                    setManagementAction("");
                    setSelectedDepartment("");
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showReturnModal && selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content return-modal">
            <h3>Return Case to Investigator</h3>
            <p>Please provide comments for the investigator:</p>
            <textarea
              value={returnComments}
              onChange={(e) => setReturnComments(e.target.value)}
              placeholder="Enter comments explaining why the case is being returned..."
              rows={5}
            />
            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnComments("");
                }}
              >
                Cancel
              </button>
              <button
                className="update-btn"
                onClick={handleReturnToInvestigator}
                disabled={!returnComments.trim()}
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
