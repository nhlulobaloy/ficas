/* PreliminaryReview.tsx */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PreliminaryReview.css";

interface PreliminaryComment {
  id: number;
  preliminary_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

interface PreliminaryInvestigation {
  id: number;
  incident_id: number;
  mandate: string;
  allegations: string;
  acknowledgement_details?: string;
  case_category: string;
  case_subcategory: string;
  domicile_department: string;
  key_stakeholders?: string;
  incident_scene?: string;
  amount_involved?: string;
  persons_to_notify?: string;
  persons_featured?: string;
  legal_framework?: string;
  preliminary_findings: string;
  annexures?: string;
  recommendations: "pending" | "close" | "full_investigation" | "refer" | "";
  referred_department?: string;
  status: "draft" | "review" | "approved" | "returned";
  conducted_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at?: string;
  incident_number?: string;
  complainant_name?: string;
  assigned_investigator_name?: string;
  assigned_to?: number;
  comments?: PreliminaryComment[];
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

interface ReturnData {
  comments: string;
  status: "returned";
}

export default function PreliminaryReview() {
  const [investigations, setInvestigations] = useState<PreliminaryInvestigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<PreliminaryInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvestigation, setSelectedInvestigation] = useState<PreliminaryInvestigation | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComments, setReturnComments] = useState("");
  const [managementAction, setManagementAction] = useState<'assign_investigator' | 'close_case' | 'refer_department' | 'return' | ''>('');
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemPerPage] = useState<number>(10);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ✅ Verify access first
  const verifyAccess = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/preliminary/auth/access", {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const allowed = await verifyAccess();
      if (!allowed) return;

      const res = await fetch(`http://localhost:3000/api/preliminary?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInvestigations(data.data || []);
      setFilteredInvestigations(data.data || []);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED FETCH FUNCTION
  const fetchInvestigatorAndDepartments = async () => {
    try {
      const [invRes, depRes] = await Promise.all([
        fetch("http://localhost:3000/api/preliminary/investigators", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Changed to match first file's endpoint
        fetch("http://localhost:3000/api/preli/departments", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!invRes.ok) {
        console.error("Investigator fetch failed:", await invRes.text());
      }
      if (!depRes.ok) {
        console.error("Department fetch failed:", await depRes.text());
      }

      const investigatorsData = await invRes.json();
      const departmentsData = await depRes.json();


      // Handle different response formats
      setInvestigators(investigatorsData.data || investigatorsData || []);
      setDepartments(departmentsData.data || departmentsData || []);
    } catch (err) {
      console.error("Error fetching investigators/departments:", err);
    }
  };

  useEffect(() => {
    fetchInvestigations();
    fetchInvestigatorAndDepartments();
  }, [token, currentPage, itemsPerPage]);

  // Filter by search and status
  useEffect(() => {
    let filtered = investigations;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.complainant_name?.toLowerCase().includes(s) ||
          item.incident_number?.toLowerCase().includes(s) ||
          item.assigned_investigator_name?.toLowerCase().includes(s) ||
          item.incident_id?.toString().includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredInvestigations(filtered);
  }, [searchTerm, statusFilter, investigations]);

  // Reset form when management action changes
  useEffect(() => {
    if (managementAction !== 'assign_investigator') {
      setSelectedInvestigator('');
    }
    if (managementAction !== 'refer_department') {
      setSelectedDepartment('');
    }
  }, [managementAction]);

  // Assign to Investigator
  const handleAssignInvestigator = async (id: number) => {
    if (!selectedInvestigator) {
      setSessionMessage("Please select an investigator");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }

    try {
      //const userName = localStorage.getItem("name") || "User";
      const selectedInv = investigators.find(inv => inv.id === parseInt(selectedInvestigator));

      const res = await fetch(`http://localhost:3000/api/preliminary/assign/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assigned_to: parseInt(selectedInvestigator),
          assigned_investigator_name: selectedInv ? `${selectedInv.name} (${selectedInv.email})` : '',
          status: "approved"
          //reviewed_by: userName 
        }),
      });

      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                ...i,
                status: "approved",
                assigned_to: parseInt(selectedInvestigator),
                assigned_investigator_name: selectedInv ? `${selectedInv.name} (${selectedInv.email})` : '',
                //reviewed_by: userName 
              }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setManagementAction('');
        setSelectedInvestigator('');
        setSessionMessage("Investigator assigned successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  // Close Case
  const handleCloseCase = async (id: number) => {
    try {
      const userName = localStorage.getItem("name") || "User";
      const res = await fetch(`http://localhost:3000/api/preliminary/close/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "closed",
          recommendations: "close",
          //reviewed_by: userName 
        }),
      });

      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                ...i,
                status: "approved",
                recommendations: "close",
                reviewed_by: userName
              }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setManagementAction('');
        setSessionMessage("Case closed successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  // Refer to Department
  const handleReferDepartment = async (id: number) => {
    if (!selectedDepartment) {
      setSessionMessage("Please select a department");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }

    try {
      const selectedDept = departments.find(dept => dept.id === parseInt(selectedDepartment));
      const res = await fetch(`http://localhost:3000/api/preliminary/refer/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referred_department: selectedDept?.name || selectedDepartment,
          status: "approved",
          recommendations: "refer"
        }),
      });

      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                ...i,
                status: "approved",
                referred_department: selectedDept?.name || selectedDepartment,
                recommendations: "refer"
              }
              : i,
          ),
        );
        setSelectedInvestigation(null);
        setManagementAction('');
        setSelectedDepartment('');
        setSessionMessage("Case referred to department successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  // Return investigation
  const handleReturnToInvestigator = async () => {
    if (!selectedInvestigation || !returnComments.trim()) {
      setSessionMessage("Please provide comments for return");
      return;
    }

    try {
      const returnData: ReturnData = {
        comments: returnComments,
        status: "returned"
      };

      const res = await fetch(`http://localhost:3000/api/preliminary/return/${selectedInvestigation.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(returnData),
      });

      if (res.ok) {
        setInvestigations((prev) =>
          prev.map((i) =>
            i.id === selectedInvestigation.id
              ? {
                ...i,
                status: "returned",
                comments: [
                  ...(i.comments || []),
                  {
                    comment: returnComments,
                    user_name: localStorage.getItem("name") || "User",
                    id: Date.now(),
                    preliminary_id: i.id,
                    user_id: 0,
                    created_at: new Date().toISOString(),
                  }
                ],
              }
              : i,
          ),
        );

        setFilteredInvestigations((prev) =>
          prev.map((i) =>
            i.id === selectedInvestigation.id
              ? {
                ...i,
                status: "returned",
                comments: [
                  ...(i.comments || []),
                  {
                    comment: returnComments,
                    user_name: localStorage.getItem("name") || "User",
                    id: Date.now(),
                    preliminary_id: i.id,
                    user_id: 0,
                    created_at: new Date().toISOString(),
                  }
                ],
              }
              : i,
          ),
        );

        setSelectedInvestigation(null);
        setShowReturnModal(false);
        setReturnComments("");
        setManagementAction('');
        setSessionMessage("Case returned to investigator successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      } else {
        const errorData = await res.json();
        setSessionMessage(errorData.error || "Error returning case");
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "status-draft";
      case "review": return "status-review";
      case "approved": return "status-approved";
      case "returned": return "status-returned";
      default: return "";
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case "close": return "Close";
      case "full_investigation": return "Full Investigation";
      case "refer": return "Refer to Department";
      default: return "Pending";
    }
  };

  const handleView = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/preliminary/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedInvestigation(data.data);
        setManagementAction('');
        setSelectedInvestigator('');
        setSelectedDepartment('');
      }
    } catch (err) {
      console.error("Error fetching investigation:", err);
    }
  };

  const handleApplyAction = () => {
    if (!selectedInvestigation || !managementAction) return;

    switch (managementAction) {
      case 'assign_investigator':
        handleAssignInvestigator(selectedInvestigation.id);
        break;
      case 'close_case':
        handleCloseCase(selectedInvestigation.id);
        break;
      case 'refer_department':
        handleReferDepartment(selectedInvestigation.id);
        break;
      case 'return':
        setShowReturnModal(true);
        break;
      default:
        break;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!investigations.length) return <div className="no-data">No preliminary investigations found</div>;

  return (

    <div className="preliminary-review-container">
      {sessionMessage && <div className="session-message">{sessionMessage}</div>}
      <h2 className="dashboard-title">Preliminary Review</h2>

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by incident #, complainant, investigator..."
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
          <option value="returned">Returned</option>
          <option value="approved">Approved</option>
        </select>
      </div>
      <>
        <table>
          <thead>
            <tr>
              <th>Incident #</th>
              <th>Complainant</th>
              <th>Investigator</th>
              <th>Category</th>
              <th>Recommendation</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigations.map((i) => (
              <tr key={i.id}>
                <td>{i.incident_number || `INC-${i.incident_id}`}</td>
                <td>{i.complainant_name || "N/A"}</td>
                <td>{i.assigned_investigator_name || "N/A"}</td>
                <td>{i.case_category || "N/A"}</td>
                <td>{getRecommendationText(i.recommendations)}</td>
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
        {/* pagination */}
        {totalPages > 1 && (
          <div className="pagination">

            <button onClick={() =>  setCurrentPage(prev => prev - 1)}
              disabled = {currentPage === 1}
              >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>

            
            <button onClick={() =>  setCurrentPage(prev => prev + 1)}
              disabled = {currentPage === totalPages}
              >
              Next
            </button>
          </div>
        )}

      </>


      {/* Investigation Modal */}
      {selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Preliminary Investigation Details</h3>
            <button
              className="close-btn"
              onClick={() => {
                setSelectedInvestigation(null);
                setManagementAction('');
                setSelectedInvestigator('');
                setSelectedDepartment('');
              }}
            >
              ×
            </button>

            <div className="details-grid">
              <div><strong>Incident #:</strong> {selectedInvestigation.incident_number || `INC-${selectedInvestigation.incident_id}`}</div>
              <div><strong>Complainant:</strong> {selectedInvestigation.complainant_name || "N/A"}</div>
              <div><strong>Investigator:</strong> {selectedInvestigation.assigned_investigator_name || "N/A"}</div>
              <div><strong>Category:</strong> {selectedInvestigation.case_category || "N/A"}</div>
              <div><strong>Subcategory:</strong> {selectedInvestigation.case_subcategory || "N/A"}</div>
              <div><strong>Department:</strong> {selectedInvestigation.domicile_department || "N/A"}</div>
              <div><strong>Recommendation:</strong> {getRecommendationText(selectedInvestigation.recommendations)}</div>
              <div><strong>Status:</strong> {selectedInvestigation.status}</div>
              {selectedInvestigation.reviewed_by && <div><strong>Reviewed By:</strong> {selectedInvestigation.reviewed_by}</div>}
              {selectedInvestigation.approved_by && <div><strong>Approved By:</strong> {selectedInvestigation.approved_by}</div>}
              {selectedInvestigation.referred_department && <div><strong>Referred Department:</strong> {selectedInvestigation.referred_department}</div>}
              <div><strong>Mandate:</strong> {selectedInvestigation.mandate || "Not provided"}</div>
              <div><strong>Allegations:</strong> {selectedInvestigation.allegations || "Not provided"}</div>
              <div><strong>Acknowledgement Details:</strong> {selectedInvestigation.acknowledgement_details || "Not provided"}</div>
              <div><strong>Key Stakeholders:</strong> {selectedInvestigation.key_stakeholders || "Not provided"}</div>
              <div><strong>Incident Scene:</strong> {selectedInvestigation.incident_scene || "Not provided"}</div>
              <div><strong>Amount Involved:</strong> {selectedInvestigation.amount_involved || "Not provided"}</div>
              <div><strong>Persons to Notify:</strong> {selectedInvestigation.persons_to_notify || "Not provided"}</div>
              <div><strong>Persons Featured:</strong> {selectedInvestigation.persons_featured || "Not provided"}</div>
              <div><strong>Legal Framework:</strong> {selectedInvestigation.legal_framework || "Not provided"}</div>
              <div><strong>Preliminary Findings:</strong> {selectedInvestigation.preliminary_findings || "Not provided"}</div>
              <div><strong>Annexures:</strong> {selectedInvestigation.annexures || "Not provided"}</div>

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
                      onChange={(e) => setManagementAction(e.target.value as any)}
                    >
                      <option value="">-- Select Action --</option>
                      <option value="assign_investigator">Assign to Investigator</option>
                      <option value="close_case">Close Case</option>
                      <option value="refer_department">Refer to Department</option>
                      <option value="return">Return to Investigator</option>
                    </select>
                  </div>

                  {managementAction === 'assign_investigator' && (
                    <div className="assignment-item">
                      <label htmlFor="investigator">Select Investigator:</label>
                      <select
                        id="investigator"
                        value={selectedInvestigator}
                        onChange={(e) => setSelectedInvestigator(e.target.value)}
                      >
                        <option value="">-- Select Investigator --</option>
                        {investigators.map((investigator) => (
                          <option key={investigator.id} value={investigator.id}>
                            {investigator.name} ({investigator.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {managementAction === 'refer_department' && (
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
                </div>

                <div className="modal-buttons">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setSelectedInvestigation(null);
                      setManagementAction('');
                      setSelectedInvestigator('');
                      setSelectedDepartment('');
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="update-btn"
                    onClick={handleApplyAction}
                    disabled={
                      !managementAction ||
                      (managementAction === 'assign_investigator' && !selectedInvestigator) ||
                      (managementAction === 'refer_department' && !selectedDepartment)
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
                    setManagementAction('');
                    setSelectedInvestigator('');
                    setSelectedDepartment('');
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
              <button className="cancel-btn" onClick={() => {
                setShowReturnModal(false);
                setReturnComments('');
              }}>
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