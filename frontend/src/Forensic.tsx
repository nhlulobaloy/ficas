import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../styles/Preliminary.css";
import "../styles/ReviewIncident.css";

interface Comment {
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
  comments?: Comment[];
}

export default function Forensic() {
  const [data, setData] = useState<PreliminaryInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionMessage, setSessionMessage] = useState("");
  const [selectedInvestigation, setSelectedInvestigation] = useState<PreliminaryInvestigation | null>(null);
  const [exporting, setExporting] = useState<"word" | "pdf" | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1)

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name");

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/forensic?limit=${limit}&page=${currentPage}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        setData(json.data || []);
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
    const name = item.complainant_name?.toLowerCase() || "";
    const incidentNo = item.incident_number?.toLowerCase() || "";
    const status = item.status || "draft";

    const matchesSearch = name.includes(s) || incidentNo.includes(s);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesStatus;
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

  // Helper to build HTML string from investigation details (for Word export)
  const buildDetailsHTML = (inv: PreliminaryInvestigation): string => {
    const incidentNumber = inv.incident_number || `INC-${inv.incident_id}`;
    const commentsHTML = (inv.comments || []).map(c =>
      `<li><strong>${c.user_name}:</strong> ${c.comment} <em>(${new Date(c.created_at).toLocaleString()})</em></li>`
    ).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .item { margin: 5px 0; }
            .full-width { grid-column: span 2; }
            .comments { margin-top: 20px; }
            .comments ul { list-style: none; padding: 0; }
            .comments li { background: #f9f9f9; margin: 5px 0; padding: 8px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h2>Forensic Investigation Details</h2>
          <div class="grid">
            <div class="item"><strong>Incident #:</strong> ${incidentNumber}</div>
            <div class="item"><strong>Complainant:</strong> ${inv.complainant_name || 'N/A'}</div>
            <div class="item"><strong>Investigator:</strong> ${inv.assigned_investigator_name || 'N/A'}</div>
            <div class="item"><strong>Category:</strong> ${inv.case_category}</div>
            <div class="item"><strong>Subcategory:</strong> ${inv.case_subcategory || 'N/A'}</div>
            <div class="item"><strong>Department:</strong> ${inv.domicile_department || 'N/A'}</div>
            <div class="item"><strong>Recommendation:</strong> ${inv.recommendations || 'pending'}</div>
            <div class="item"><strong>Status:</strong> ${inv.status}</div>
            <div class="item"><strong>Mandate:</strong> ${inv.mandate || 'N/A'}</div>
            <div class="item"><strong>Allegations:</strong> ${inv.allegations || 'N/A'}</div>
            <div class="full-width"><strong>Preliminary Findings:</strong> ${inv.preliminary_findings || 'N/A'}</div>
          </div>
          ${inv.comments?.length ? `
            <div class="comments">
              <strong>Comments:</strong>
              <ul>${commentsHTML}</ul>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  // Export as Word (.doc) using HTML blob
  const exportToWord = () => {
    if (!selectedInvestigation) return;
    setExporting("word");
    try {
      const htmlContent = buildDetailsHTML(selectedInvestigation);
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Forensic_${selectedInvestigation.incident_number || selectedInvestigation.id}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Word export failed:", error);
      alert("Failed to export Word document.");
    } finally {
      setExporting(null);
    }
  };

  // Export as PDF using jspdf + html2canvas
  const exportToPDF = async () => {
    if (!selectedInvestigation) return;
    setExporting("pdf");
    try {
      // Create a temporary container to render the details (same as modal layout)
      const container = document.createElement("div");
      container.style.width = "800px";
      container.style.padding = "20px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.backgroundColor = "#fff";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Populate container with same structure as modal
      const incidentNumber = selectedInvestigation.incident_number || `INC-${selectedInvestigation.incident_id}`;
      container.innerHTML = `
        <h2 style="color:#2c3e50; border-bottom:1px solid #ccc;">Forensic Investigation Details</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><strong>Incident #:</strong> ${incidentNumber}</div>
          <div><strong>Complainant:</strong> ${selectedInvestigation.complainant_name || 'N/A'}</div>
          <div><strong>Investigator:</strong> ${selectedInvestigation.assigned_investigator_name || 'N/A'}</div>
          <div><strong>Category:</strong> ${selectedInvestigation.case_category}</div>
          <div><strong>Subcategory:</strong> ${selectedInvestigation.case_subcategory || 'N/A'}</div>
          <div><strong>Department:</strong> ${selectedInvestigation.domicile_department || 'N/A'}</div>
          <div><strong>Recommendation:</strong> ${selectedInvestigation.recommendations || 'pending'}</div>
          <div><strong>Status:</strong> ${selectedInvestigation.status}</div>
          <div><strong>Mandate:</strong> ${selectedInvestigation.mandate || 'N/A'}</div>
          <div><strong>Allegations:</strong> ${selectedInvestigation.allegations || 'N/A'}</div>
          <div style="grid-column:span 2;"><strong>Preliminary Findings:</strong> ${selectedInvestigation.preliminary_findings || 'N/A'}</div>
        </div>
        ${selectedInvestigation.comments?.length ? `
          <div style="margin-top:20px;">
            <strong>Comments:</strong>
            <ul style="list-style:none; padding:0;">
              ${selectedInvestigation.comments.map(c => `<li style="background:#f9f9f9; margin:5px 0; padding:8px; border-radius:4px;"><strong>${c.user_name}:</strong> ${c.comment} <em>(${new Date(c.created_at).toLocaleString()})</em></li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      const canvas = await html2canvas(container, { scale: 2 });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2] // roughly A4 friendly
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Forensic_${selectedInvestigation.incident_number || selectedInvestigation.id}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF.");
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <div className="loading">Loading investigations...</div>;

  return (
    <div className="preliminary-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Draft Forensic</h2>
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
          placeholder="Search by name or incident #"
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
                <th>Incident #</th>
                <th>Complainant</th>
                <th>Status</th>
                <th>Investigator</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.incident_number || `INC-${item.incident_id}`}</td>
                  <td>{item.complainant_name || "N/A"}</td>
                  <td><span className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</span></td>
                  <td>{item.assigned_investigator_name || "N/A"}</td>
                  <td>
                    <button className="view-btn" onClick={() => setSelectedInvestigation(item)}>View Details</button>
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
                disabled = {currentPage === totalPages}
                >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {selectedInvestigation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Investigation Details</h3>
            <div className="details-grid">
              <div><strong>Incident #:</strong> {selectedInvestigation.incident_number || `INC-${selectedInvestigation.incident_id}`}</div>
              <div><strong>Complainant:</strong> {selectedInvestigation.complainant_name}</div>
              <div><strong>Investigator:</strong> {selectedInvestigation.assigned_investigator_name || "N/A"}</div>
              <div><strong>Category:</strong> {selectedInvestigation.case_category}</div>
              <div><strong>Subcategory:</strong> {selectedInvestigation.case_subcategory || "N/A"}</div>
              <div><strong>Department:</strong> {selectedInvestigation.domicile_department || "N/A"}</div>
              <div><strong>Recommendation:</strong> {selectedInvestigation.recommendations || "pending"}</div>
              <div><strong>Status:</strong> {selectedInvestigation.status}</div>
              <div><strong>Mandate:</strong> {selectedInvestigation.mandate || "N/A"}</div>
              <div><strong>Allegations:</strong> {selectedInvestigation.allegations || "N/A"}</div>
              <div className="full-width"><strong>Preliminary Findings:</strong> {selectedInvestigation.preliminary_findings || "N/A"}</div>
            </div>

            {/* Comments Section */}
            {(selectedInvestigation.comments || []).length > 0 && (
              <div className="comments-section">
                <strong>Comments:</strong>
                <ul>
                  {(selectedInvestigation.comments || []).map((c) => (
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
                  setSelectedInvestigation(null);
                  navigate(`/draft/forensic/${selectedInvestigation.id}`);
                }}
              >
                Draft
              </button>
              {/* New Export Buttons */}
              <button onClick={exportToWord} disabled={exporting === "word"}>
                {exporting === "word" ? "Generating Word..." : "Download Word"}
              </button>
              <button onClick={exportToPDF} disabled={exporting === "pdf"}>
                {exporting === "pdf" ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}