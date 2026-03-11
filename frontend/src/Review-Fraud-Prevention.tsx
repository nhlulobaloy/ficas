/* ReviewFraudPrevention.tsx */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PreliminaryReview.css";

interface Comment {
  id: number;
  fraud_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

interface FraudPreventionInvestigation {
  id: number;
  forensic_id?: number;
  executive_summary?: string;
  abbreviations?: string;
  annexures?: string;
  individuals_featured?: string;
  mandate?: string;
  purpose_and_objective?: string;
  scope_of_investigation?: string;
  restrictions_and_limitations?: string;
  legislative_policy_framework?: string;
  review_methodology?: string;
  tone_at_the_top?: string;
  review_details?: string;
  sequence_of_events?: string;
  findings?: string;
  conclusions?: string;
  recommendations?: string;
  general?: string;
  fraud_prevention?: string;
  status: "draft" | "review" | "approved" | "closed";
  conducted_by?: string | null;
  assigned_to?: number;
  assigned_investigator_name?: string;
  referred_department?: number | null;
  created_at: string;
  updated_at?: string;
  comments?: Comment[];
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

export default function ReviewFraudPrevention() {
  const [investigations, setInvestigations] = useState<FraudPreventionInvestigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<FraudPreventionInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvestigation, setSelectedInvestigation] = useState<FraudPreventionInvestigation | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComments, setReturnComments] = useState("");
  const [managementAction, setManagementAction] = useState<"assign_investigator" | "close_case" | "refer_department" | "return" | "">("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(1);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // ✅ Access verification function
  const verifyAccess = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/fraud/prevention/auth/access",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  // Fetch Investigators
  const fetchInvestigators = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/fraud/prevention/investigators/prevention", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setInvestigators(data.results || []);
    } catch (err) { console.error(err); }
  };

  // Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/preli/departments", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDepartments(data.data || data || []);
    } catch (err) { console.error(err); }
  };

  // Fetch all Investigations (with access check)
  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const allowed = await verifyAccess();
      if (!allowed) return;

      const res = await fetch(`http://localhost:3000/api/fraud/prevention/review/prevention`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setInvestigations(data.results || []);
      setFilteredInvestigations(data.results || []);
      setTotalPages(data.pagination.totalPages)
    } catch (err) { console.error(err); setSessionMessage("Failed to fetch investigations"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchInvestigations();
    fetchDepartments();
    fetchInvestigators();
  }, []);

  useEffect(() => {
    let filtered = investigations;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.executive_summary?.toLowerCase().includes(s) ||
        item.mandate?.toLowerCase().includes(s) ||
        item.id?.toString().includes(searchTerm) ||
        item.forensic_id?.toString().includes(searchTerm) ||
        item.assigned_investigator_name?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    setFilteredInvestigations(filtered);
  }, [searchTerm, statusFilter, investigations]);

  useEffect(() => {
    if (managementAction !== "refer_department") setSelectedDepartment("");
  }, [managementAction]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "status-draft";
      case "review": return "status-review";
      case "approved": return "status-approved";
      case "closed": return "status-closed";
      default: return "";
    }
  };

  // View single investigation
  const handleView = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/fraud/prevention/review/case/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setSelectedInvestigation(data.results);
        setManagementAction("");
        setSelectedDepartment("");
      }
    } catch (err) { console.error("Error fetching investigation:", err); }
  };

  // Management actions
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
    }
  };

  const handleCloseCase = async (id: number) => {
    const userName = localStorage.getItem("name") || "User";
    try {
      const res = await fetch(`http://localhost:3000/api/fraud/prevention/close/case/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "closed", conducted_by: userName }),
      });
      if (res.ok) {
        setInvestigations(prev => prev.map(i => i.id === id ? { ...i, status: "closed", conducted_by: userName } : i));
        setSelectedInvestigation(null);
        setManagementAction("");
        setSessionMessage("Case closed successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) { console.error(err); setSessionMessage("Server error"); }
  };

  const handleReferDepartment = async (id: number) => {
    if (!selectedDepartment) { setSessionMessage("Please select a department"); setTimeout(() => setSessionMessage(""), 3000); return; }
    const selectedDept = departments.find(d => d.id === parseInt(selectedDepartment));
    try {
      const res = await fetch(`http://localhost:3000/api/fraud/prevention/refer/case/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referred_department: selectedDept?.id, status: "approved", recommendations: "refer" }),
      });
      if (res.ok) {
        setInvestigations(prev => prev.map(i => i.id === id ? { ...i, status: "approved", referred_department: selectedDept?.id } : i));
        setSelectedInvestigation(null);
        setManagementAction("");
        setSelectedDepartment("");
        setSessionMessage("Case referred successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) { console.error(err); setSessionMessage("Server error"); }
  };

  const handleAssignInvestigator = async (id: number) => {
    const selectedInv = investigators.find(inv => inv.id.toString() === selectedInvestigator);
    if (!selectedInv) { setSessionMessage("Please select a valid investigator"); setTimeout(() => setSessionMessage(""), 3000); return; }
    try {
      const res = await fetch(`http://localhost:3000/api/fraud/prevention/assign/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigned_to: selectedInv.id, conducted_by: selectedInv.name, status: "review" }),
      });
      if (res.ok) {
        setInvestigations(prev => prev.map(i => i.id === id ? { ...i, conducted_by: selectedInv.name, status: "review", assigned_investigator_name: selectedInv.name } : i));
        setSelectedInvestigation(null);
        setManagementAction("");
        setSelectedInvestigator("");
        setSessionMessage("Investigator assigned successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) { console.error(err); setSessionMessage("Server error"); }
  };

  const handleReturnToInvestigator = async () => {
    if (!selectedInvestigation || !returnComments.trim()) { setSessionMessage("Please provide comments for return"); return; }
    try {
      const res = await fetch(`http://localhost:3000/api/fraud/prevention/return/case/${selectedInvestigation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comments: returnComments, status: "returned" }),
      });
      if (res.ok) {
        setInvestigations(prev => prev.map(i => i.id === selectedInvestigation.id
          ? { ...i, status: "review", comments: [...(i.comments || []), { id: Date.now(), fraud_id: i.id, user_id: 0, user_name: localStorage.getItem("name") || "User", comment: returnComments, created_at: new Date().toISOString() }] }
          : i
        ));
        setSelectedInvestigation(null);
        setShowReturnModal(false);
        setReturnComments("");
        setManagementAction("");
        setSessionMessage("Case returned successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) { console.error(err); setSessionMessage("Server error"); }
  };

  // ================== RENDER ==================
  if (loading) return <div className="loading">Loading...</div>;
  if (!investigations.length) return <div className="no-data">No fraud prevention investigations found</div>;

  return (
    <div className="preliminary-review-container">
      {sessionMessage && <div className="session-message">{sessionMessage}</div>}
      <h2 className="dashboard-title">Fraud Prevention Review</h2>

      <div className="filter-controls">
        <input
          type="text"
          placeholder="Search by ID, forensic ID, executive summary, mandate..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
            <th>Forensic ID</th>
            <th>Recommendations</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvestigations.map(i => (
            <tr key={i.id}>
              <td>{i.forensic_id || "N/A"}</td>
              <td>{i.recommendations || "N/A"}</td>
              <td><span className={`status-badge ${getStatusColor(i.status)}`}>{i.status}</span></td>
              <td><button onClick={() => handleView(i.id)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
       <div className="pagination">

       <button onClick={() => setCurrentPage(prev => prev - 1)}
        disabled = {currentPage ===1}
        >

          Previous
        </button>

        <span>Page {currentPage} of {totalPages}</span>

                  <button onClick={() => setCurrentPage(prev => prev + 1)}
        disabled = {currentPage === totalPages}
        >

          Next 
        </button>         
       </div>
      )}
</>
      {/* Modal */}
      {selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Fraud Prevention Investigation Details</h3>
            <button className="close-btn" onClick={() => { setSelectedInvestigation(null); setManagementAction(""); setSelectedDepartment(""); }}>×</button>

            <div className="details-grid">
              <div><strong>ID:</strong> {selectedInvestigation.id}</div>
              <div><strong>Forensic ID:</strong> {selectedInvestigation.forensic_id}</div>
              <div><strong>Status:</strong> {selectedInvestigation.status}</div>
              <div><strong>Conducted By:</strong> {selectedInvestigation.conducted_by || "N/A"}</div>
              <div><strong>Assigned To:</strong> {selectedInvestigation.assigned_investigator_name || selectedInvestigation.assigned_to || "N/A"}</div>
              <div><strong>Referred Department:</strong> {selectedInvestigation.referred_department || "N/A"}</div>
              <div><strong>Created At:</strong> {new Date(selectedInvestigation.created_at).toLocaleString()}</div>
              <div><strong>Updated At:</strong> {selectedInvestigation.updated_at ? new Date(selectedInvestigation.updated_at).toLocaleString() : "N/A"}</div>

              <div><strong>Executive Summary:</strong> {selectedInvestigation.executive_summary}</div>
              <div><strong>Abbreviations:</strong> {selectedInvestigation.abbreviations}</div>
              <div><strong>Annexures:</strong> {selectedInvestigation.annexures}</div>
              <div><strong>Individuals Featured:</strong> {selectedInvestigation.individuals_featured}</div>
              <div><strong>Mandate:</strong> {selectedInvestigation.mandate}</div>
              <div><strong>Purpose & Objective:</strong> {selectedInvestigation.purpose_and_objective}</div>
              <div><strong>Scope of Investigation:</strong> {selectedInvestigation.scope_of_investigation}</div>
              <div><strong>Restrictions & Limitations:</strong> {selectedInvestigation.restrictions_and_limitations}</div>
              <div><strong>Legislative Policy Framework:</strong> {selectedInvestigation.legislative_policy_framework}</div>
              <div><strong>Review Methodology:</strong> {selectedInvestigation.review_methodology}</div>
              <div><strong>Tone at the Top:</strong> {selectedInvestigation.tone_at_the_top}</div>
              <div><strong>Review Details:</strong> {selectedInvestigation.review_details}</div>
              <div><strong>Sequence of Events:</strong> {selectedInvestigation.sequence_of_events}</div>
              <div><strong>Findings:</strong> {selectedInvestigation.findings}</div>
              <div><strong>Conclusions:</strong> {selectedInvestigation.conclusions}</div>
              <div><strong>Recommendations:</strong> {selectedInvestigation.recommendations}</div>
              <div><strong>General:</strong> {selectedInvestigation.general}</div>
              <div><strong>Fraud Prevention:</strong> {selectedInvestigation.fraud_prevention}</div>

              {(selectedInvestigation.comments || []).length > 0 && (
                <div className="comments-section">
                  <strong>Comments:</strong>
                  <ul>
                    {selectedInvestigation.comments?.map(c => (
                      <li key={c.id}><strong>{c.user_name}:</strong> {c.comment}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Management Actions */}
            {selectedInvestigation.status === "review" && (
              <div className="action-section">
                <div className="assignment-grid">
                  <div className="assignment-item">
                    <label>Management Action:</label>
                    <select value={managementAction} onChange={e => setManagementAction(e.target.value as any)}>
                      <option value="">-- Select Action --</option>
                      <option value="close_case">Close Case</option>
                      <option value="refer_department">Refer to Department</option>
                      <option value="return">Return to Investigator</option>
                      <option value="assign_investigator">Assign Investigator</option>
                    </select>
                  </div>

                  {managementAction === "refer_department" && (
                    <div className="assignment-item">
                      <label>Select Department:</label>
                      <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                        <option value="">-- Select Department --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}

                  {managementAction === "assign_investigator" && (
                    <div className="assignment-item">
                      <label>Select Investigator:</label>
                      <select value={selectedInvestigator} onChange={e => setSelectedInvestigator(e.target.value)}>
                        <option value="">-- Select Investigator --</option>
                        {investigators.map(inv => <option key={inv.id} value={inv.id}>{inv.name} ({inv.email})</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-buttons">
                  <button className="cancel-btn" onClick={() => { setSelectedInvestigation(null); setManagementAction(""); setSelectedDepartment(""); }}>Close</button>
                  <button className="update-btn" onClick={handleApplyAction} disabled={!managementAction || (managementAction === "refer_department" && !selectedDepartment)}>Apply Action</button>
                </div>
              </div>
            )}

            {showReturnModal && selectedInvestigation && (
              <div className="modal-overlay">
                <div className="modal-content return-modal">
                  <h3>Return Case to Investigator</h3>
                  <textarea value={returnComments} onChange={e => setReturnComments(e.target.value)} placeholder="Enter comments..." rows={5} />
                  <div className="modal-buttons">
                    <button className="cancel-btn" onClick={() => { setShowReturnModal(false); setReturnComments(""); }}>Cancel</button>
                    <button className="update-btn" onClick={handleReturnToInvestigator} disabled={!returnComments.trim()}>Submit Return</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}