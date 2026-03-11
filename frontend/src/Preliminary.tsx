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

interface Incident {
  id: number;
  incident_number?: string | null;
  complainant_name?: string | null;
  complainant_email?: string | null;
  complainant_contact?: string | null;
  incident_date?: string | null;
  incident_time?: string | null;
  location?: string | null;
  details?: string | null;
  suspect_details?: string | null;
  ssaps_case_number?: string | null;
  recommendations?: string | null;
  assigned_to?: number | null;
  assigned_at?: string | null;
  referred_department?: string | null;
  name?: string | null;
  email?: string | null;
  preliminary_id?: number | null;
  preliminary_status?: string | null;
  comments?: Comment[];
}

export default function PreliminaryInvestigationDashboard() {
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [recommendationFilter, setRecommendationFilter] = useState("all");
  const [sessionMessage, setSessionMessage] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [exporting, setExporting] = useState<"word" | "pdf" | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemPerPage] = useState<number>(10);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/preliminary/assigned?page=${currentPage}limit=${itemsPerPage}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          throw new Error("Fetch failed");
        } else {
          const json = await res.json();
          setData(json.data || []);
          setTotalPages(json.pagination.totalPages)
        }
      } catch (e) {
        console.error(e);
        setSessionMessage("Failed to fetch incidents");
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [token, currentPage, totalPages]);

  const filtered = data.filter((item) => {
    const s = search.toLowerCase();
    const name = item.complainant_name?.toLowerCase() || "";
    const incidentNo = item.incident_number?.toLowerCase() || "";
    const status = item.recommendations || "pending";

    const matchesSearch = name.includes(s) || incidentNo.includes(s);
    const matchesRecommendation =
      recommendationFilter === "all" || status === recommendationFilter;

    return matchesSearch && matchesRecommendation;
  });

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "close":
        return "status-closed";
      case "refer to preliminary":
        return "status-referred";
      case "refer to department":
        return "status-department";
      default:
        return "";
    }
  };

  // Build HTML string for Word export
  const buildDetailsHTML = (inc: Incident): string => {
    const incidentNumber = inc.incident_number || `INC-${inc.id}`;
    const commentsHTML = (inc.comments || [])
      .map(
        (c) =>
          `<li><strong>${c.user_name}:</strong> ${c.comment} <em>(${new Date(c.created_at).toLocaleString()})</em></li>`,
      )
      .join("");

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
          <h2>Incident Details</h2>
          <div class="grid">
            <div class="item"><strong>Incident #:</strong> ${incidentNumber}</div>
            <div class="item"><strong>Complainant:</strong> ${inc.complainant_name || "N/A"}</div>
            <div class="item"><strong>Email:</strong> ${inc.complainant_email || "N/A"}</div>
            <div class="item"><strong>Contact:</strong> ${inc.complainant_contact || "N/A"}</div>
            <div class="item"><strong>Date:</strong> ${inc.incident_date || "N/A"}</div>
            <div class="item"><strong>Time:</strong> ${inc.incident_time || "N/A"}</div>
            <div class="item"><strong>Location:</strong> ${inc.location || "N/A"}</div>
            <div class="full-width"><strong>Details:</strong> ${inc.details || "N/A"}</div>
            <div class="full-width"><strong>Suspect:</strong> ${inc.suspect_details || "N/A"}</div>
            <div class="item"><strong>SAPS #:</strong> ${inc.ssaps_case_number || "N/A"}</div>
            <div class="item"><strong>Status:</strong> ${inc.recommendations || "pending"}</div>
            <div class="item"><strong>Assigned Investigator:</strong> ${inc.name || "Not Assigned"}</div>
            <div class="item"><strong>Investigator Email:</strong> ${inc.email || "N/A"}</div>
          </div>
          ${inc.comments?.length
        ? `
            <div class="comments">
              <strong>Comments:</strong>
              <ul>${commentsHTML}</ul>
            </div>
          `
        : ""
      }
        </body>
      </html>
    `;
  };

  // Export as Word (.doc)
  const exportToWord = () => {
    if (!selectedIncident) return;
    setExporting("word");
    try {
      const htmlContent = buildDetailsHTML(selectedIncident);
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Incident_${selectedIncident.incident_number || selectedIncident.id}.doc`;
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

  // Export as PDF
  const exportToPDF = async () => {
    if (!selectedIncident) return;
    setExporting("pdf");
    try {
      // Create temporary container
      const container = document.createElement("div");
      container.style.width = "800px";
      container.style.padding = "20px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.backgroundColor = "#fff";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      const inc = selectedIncident;
      const incidentNumber = inc.incident_number || `INC-${inc.id}`;
      container.innerHTML = `
        <h2 style="color:#2c3e50; border-bottom:1px solid #ccc;">Incident Details</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><strong>Incident #:</strong> ${incidentNumber}</div>
          <div><strong>Complainant:</strong> ${inc.complainant_name || "N/A"}</div>
          <div><strong>Email:</strong> ${inc.complainant_email || "N/A"}</div>
          <div><strong>Contact:</strong> ${inc.complainant_contact || "N/A"}</div>
          <div><strong>Date:</strong> ${inc.incident_date || "N/A"}</div>
          <div><strong>Time:</strong> ${inc.incident_time || "N/A"}</div>
          <div><strong>Location:</strong> ${inc.location || "N/A"}</div>
          <div style="grid-column:span 2;"><strong>Details:</strong> ${inc.details || "N/A"}</div>
          <div style="grid-column:span 2;"><strong>Suspect:</strong> ${inc.suspect_details || "N/A"}</div>
          <div><strong>SAPS #:</strong> ${inc.ssaps_case_number || "N/A"}</div>
          <div><strong>Status:</strong> ${inc.recommendations || "pending"}</div>
          <div><strong>Assigned Investigator:</strong> ${inc.name || "Not Assigned"}</div>
          <div><strong>Investigator Email:</strong> ${inc.email || "N/A"}</div>
        </div>
        ${inc.comments?.length
          ? `
          <div style="margin-top:20px;">
            <strong>Comments:</strong>
            <ul style="list-style:none; padding:0;">
              ${inc.comments.map((c) => `<li style="background:#f9f9f9; margin:5px 0; padding:8px; border-radius:4px;"><strong>${c.user_name}:</strong> ${c.comment} <em>(${new Date(c.created_at).toLocaleString()})</em></li>`).join("")}
            </ul>
          </div>
        `
          : ""
        }
      `;

      const canvas = await html2canvas(container, { scale: 2 });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(
        `Incident_${selectedIncident.incident_number || selectedIncident.id}.pdf`,
      );
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF.");
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <div className="loading">Loading incidents...</div>;

  return (
    <div className="preliminary-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Preliminary Investigations</h2>
          {userName && (
            <div className="investigator-info">
              Investigator: <strong>{userName}</strong>
            </div>
          )}
        </div>
        <div className="header-stats">
          <span>
            Total: <strong>{data.length}</strong>
          </span>
          <span>
            Filtered: <strong>{filtered.length}</strong>
          </span>
        </div>
      </div>

      {sessionMessage && (
        <div className="session-message">{sessionMessage}</div>
      )}

      <div className="filter-controls">
        <input
          className="search-input"
          placeholder="Search by name or incident #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={recommendationFilter}
          onChange={(e) => setRecommendationFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="close">Close</option>
          <option value="refer to preliminary">Assigned</option>
          <option value="refer to department">Referred</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="no-incidents">No incidents found</div>
      ) : (
        <>
          <table className="incident-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Incident #</th>
                <th>Complainant</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, idx) => (
                <tr key={inc.id}>
                  <td>{idx + 1}</td>
                  <td>{inc.incident_number || `INC-${inc.id}`}</td>
                  <td>{inc.complainant_name || "N/A"}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusColor(inc.recommendations)}`}
                    >
                      {inc.recommendations || "pending"}
                    </span>
                  </td>
                  <td>{inc.name || "Unassigned"}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => setSelectedIncident(inc)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >Previous</button>

              <span>Page {currentPage} of {totalPages}</span>

              <button onClick={() => setCurrentPage(next => next + 1)}
                disabled={currentPage === totalPages}
              > Next </button>
            </div>


          )}
        </>
      )}

      {/* MODAL */}
      {selectedIncident && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Incident Details</h3>
            <div className="details-grid">
              <div>
                <strong>Incident #:</strong> {selectedIncident.incident_number}
              </div>
              <div>
                <strong>Complainant:</strong>{" "}
                {selectedIncident.complainant_name}
              </div>
              <div>
                <strong>Email:</strong>{" "}
                {selectedIncident.complainant_email || "N/A"}
              </div>
              <div>
                <strong>Contact:</strong>{" "}
                {selectedIncident.complainant_contact || "N/A"}
              </div>
              <div>
                <strong>Date:</strong> {selectedIncident.incident_date || "N/A"}
              </div>
              <div>
                <strong>Time:</strong> {selectedIncident.incident_time || "N/A"}
              </div>
              <div>
                <strong>Location:</strong> {selectedIncident.location || "N/A"}
              </div>
              <div className="full-width">
                <strong>Details:</strong> {selectedIncident.details || "N/A"}
              </div>
              <div className="full-width">
                <strong>Suspect:</strong>{" "}
                {selectedIncident.suspect_details || "N/A"}
              </div>
              <div>
                <strong>SAPS #:</strong>{" "}
                {selectedIncident.ssaps_case_number || "N/A"}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {selectedIncident.recommendations || "pending"}
              </div>
              <div>
                <strong>Assigned Investigator:</strong>{" "}
                {selectedIncident.name || "Not Assigned"}
              </div>
              <div>
                <strong>Email:</strong> {selectedIncident.email || "N/A"}
              </div>
            </div>

            {/* Comments Section */}
            {(selectedIncident.comments || []).length > 0 && (
              <div className="comments-section">
                <strong>Comments:</strong>
                <ul>
                  {(selectedIncident.comments || []).map((c) => (
                    <li key={c.id}>
                      <strong>{c.user_name}:</strong> {c.comment}{" "}
                      <em>({new Date(c.created_at).toLocaleString()})</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-buttons">
              <button onClick={() => setSelectedIncident(null)}>Close</button>
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  navigate(`/PreliminaryInvestigation/${selectedIncident.id}`);
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
