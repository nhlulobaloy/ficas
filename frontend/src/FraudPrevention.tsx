import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Preliminary.css";
import "../styles/ReviewIncident.css";

interface Comment {
  id: number;
  forensic_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

interface FraudpreventionInvestigation {
  id: number;

  preliminary_id?: number;
  background?: string;
  abbreviations?: string;
  annexures?: string;
  individuals_featured?: string;
  mandate?: string;
  purpose_and_objective?: string;
  scope_of_investigation?: string;
  restrictions_and_limitations?: string;
  legislative_policy_framework?: string;
  investigation?: string;
  interviews?: string;
  financial_exposure?: string;
  findings?: string;
  general?: string;
  recommendations: string;
  status: string;
  conducted_by?: string;
  referred_department?: string | number;
  assigned_to?: number;
  created_at: string;
  updated_at?: string;
  comments?: Comment[];
}

export default function Fraudprevention() {
  const [data, setData] = useState<FraudpreventionInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionMessage, setSessionMessage] = useState("");
  const [selectedInvestigation, setSelectedInvestigation] = useState<FraudpreventionInvestigation | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10) || 10;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name");

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/fraud/prevention?page=${currentPage}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json.results || []);
        setTotalPages(json.pagination.totalPages)
      } catch (e) {
        console.error(e);
        setSessionMessage("Failed to fetch investigations");
      } finally {
        setLoading(false);
      }
    };
    fetchInvestigations();
  }, [token, currentPage]);

  const filtered = data.filter((item) => {
    const s = search.toLowerCase();
    const status = item.status || "draft";
    return (statusFilter === "all" || status === statusFilter);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "status-pending";
      case "review": return "status-referred";
      case "approved": return "status-closed";
      case "returned": return "status-department";
      default: return "";
    }
  };

  if (loading) return <div className="loading">Loading investigations...</div>;

  const viewDetails = (item: FraudpreventionInvestigation) => {
    setSelectedInvestigation(item);
  };

  return (
    <div className="fraud-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Fraud Prevention Investigations</h2>
          {userName && <div className="investigator-info">Reviewer: <strong>{userName}</strong></div>}
        </div>
        <div className="header-stats">
          <span>Total: <strong>{data.length}</strong></span>
          <span>Filtered: <strong>{filtered.length}</strong></span>
        </div>
      </div>

      {sessionMessage && <div className="session-message">{sessionMessage}</div>}

      <div className="filter-controls">
        <input
          className="search-input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="no-incidents">No investigations found</div>
      ) : (
        <>
        <table className="incident-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>{item.id}</td>
                <td><span className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</span></td>
                <td>
                  <button className="view-btn" onClick={() => viewDetails(item)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage(prev => prev - 1)}
              disabled = {currentPage === 1}
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
      )}

      {selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Investigation Details</h3>
            <div className="details-grid">
              {Object.entries(selectedInvestigation).map(([key, value]) => (
                <div key={key}>
                  <strong>{key.replace(/_/g, " ")}:</strong> {value ? value.toString() : "N/A"}
                </div>
              ))}
            </div>

            {(selectedInvestigation.comments || []).length > 0 && (
              <div className="comments-section">
                <strong>Comments:</strong>
                <ul>
                  {(selectedInvestigation.comments ?? []).map((c) => (
                    <li key={c.id}>
                      <strong>{c.user_name}:</strong> {c.comment} <em>({new Date(c.created_at).toLocaleString()})</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-buttons">
              <button onClick={() => setSelectedInvestigation(null)}>Close</button>
<button
  onClick={() => {
    navigate(`/draft/fraud/prevention/${selectedInvestigation.id}`, { 
      state: { investigationData: selectedInvestigation } 
    });
    setSelectedInvestigation(null);
  }}
>
  Draft
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}