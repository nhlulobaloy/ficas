import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ReviewIncident.css";


interface Incident {
  id: number;
  incident_number: string;
  complainant_name: string;
  complainant_email: string;
  complainant_contact: string;
  incident_date: string;
  incident_time: string;
  location: string;
  category: string;
  category_name: string;
  details: string;
  suspect_details: string;
  ssaps_case_number: string;
  created_at: string;
  recommendations: 'pending' | 'close' | 'refer to preliminary' | 'refer to department';
  assigned_to: number | null;
  assigned_investigator_name: string | null;
  assigned_investigator_email: string | null;
  referred_department: string | null;
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

export const Review_Incident = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [error, setError] = useState("");
  const [managementAction, setManagementAction] = useState<'pending' | 'close' | 'refer to preliminary' | 'refer to department'>('pending');
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState(10);// fixed at 10;


  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // CENTRALIZED TOKEN + ROLE CHECK
const verifyAccess = async () => {
  if (!token) {
    setSessionMessage("No session token. Please login.");
    localStorage.removeItem('token');
    setTimeout(() => navigate("/login"), 2000);
    setHasAccess(false);
    return false;
  }

  try {
    const res = await fetch("http://localhost:3000/api/incidents/auth/access", {
      headers: { Authorization: `Bearer ${token}` }
    });
    //const data = await res.json();

    if (res.status !== 200) {
      setHasAccess(false); // just block the page
      return false;
    }

    setHasAccess(true);
    return true;
  } catch (err) {
    console.error(err);
    setSessionMessage("Session invalid. Please login.");
    localStorage.removeItem('token');
    setTimeout(() => navigate("/login"), 2000); // logout only for invalid token
    setHasAccess(false);
    return false;
  }
};


  // FETCH INCIDENTS, INVESTIGATORS, DEPARTMENTS
  const fetchData = async () => {
    const access = await verifyAccess();
    if (!access) return;
    

    try {
      const [incRes, invRes, depRes] = await Promise.all([
        fetch(`http://localhost:3000/api/incidents?page=${currentPage}&limit=${itemsPerPage}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/api/incidents/api/investigators", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/api/preli/departments", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const incidentsData = await incRes.json();
      const investigatorsData = await invRes.json();
      const departmentsData = await depRes.json();

      if (incRes.ok) {setIncidents(incidentsData.data || []);
        setTotalPages(incidentsData.pagination.totalPages)
      }
      if (invRes.ok) setInvestigators(investigatorsData.data || []);
      if (depRes.ok) setDepartments(departmentsData || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token,currentPage]);

  // Populate modal fields when an incident is selected
  useEffect(() => {
    if (selectedIncident) {
      setManagementAction(selectedIncident.recommendations || 'pending');
      setSelectedInvestigator(selectedIncident.assigned_to?.toString() || '');
      setSelectedDepartment(selectedIncident.referred_department || '');
    }
  }, [selectedIncident]);

  // UPDATE INCIDENT
  const handleUpdate = async (incidentId: number) => {
    const access = await verifyAccess();
    if (!access) return;

    try {
      const updateData: any = {};

      if (selectedIncident?.recommendations !== managementAction) {
        updateData.recommendations = managementAction;
      }

      if (managementAction === 'refer to preliminary') {
        updateData.assigned_to = selectedInvestigator || '';
        updateData.referred_department = '';
      } else if (managementAction === 'refer to department') {
        updateData.referred_department = selectedDepartment || '';
        updateData.assigned_to = '';
      } else {
        updateData.assigned_to = '';
        updateData.referred_department = '';
      }

      if (Object.keys(updateData).length === 0) {
        setSessionMessage("No changes made");
        setTimeout(() => setSessionMessage(""), 2000);
        return;
      }

      const res = await fetch(`http://localhost:3000/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await res.json();
      if (res.ok) {
        setSessionMessage("Management action applied successfully");
        setIncidents(incidents.map(inc => {
          if (inc.id === incidentId) {
            const updated = { ...inc, recommendations: managementAction };
            if (managementAction === 'refer to preliminary') {
              updated.assigned_to = selectedInvestigator === '' ? null : parseInt(selectedInvestigator);
              const inv = investigators.find(i => i.id === parseInt(selectedInvestigator));
              updated.assigned_investigator_name = inv ? `${inv.name} (${inv.email})` : null;
              updated.referred_department = null;
            } else if (managementAction === 'refer to department') {
              updated.assigned_to = null;
              updated.assigned_investigator_name = null;
              updated.referred_department = selectedDepartment;
            } else {
              updated.assigned_to = null;
              updated.assigned_investigator_name = null;
              updated.referred_department = null;
            }
            return updated;
          }
          return inc;
        }));
        setSelectedIncident(null);
        setTimeout(() => setSessionMessage(""), 2000);
      } else {
        setSessionMessage(data.error || "Error updating incident");
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'close': return 'status-closed';
      case 'refer to preliminary': return 'status-referred';
      case 'refer to department': return 'status-department';
      default: return '';
    }
  };

  const getDisplayText = (incident: Incident) => {
    if (incident.recommendations === 'refer to preliminary' && incident.assigned_investigator_name) {
      return `Assigned to: ${incident.assigned_investigator_name}`;
    }
    if (incident.recommendations === 'refer to department' && incident.referred_department) {
      const dept = departments.find(d => d.id.toString() === incident.referred_department);
      return `Referred to: ${dept?.name || incident.referred_department}`;
    }
    return incident.recommendations || 'pending';
  };

  if (loading) return <div className="loading">Loading incidents...</div>;
  if (hasAccess === false) return <div className="access-denied">Access denied</div>;

  return (
    <div className="review-container">
      <h2>Review Incidents</h2>
      {sessionMessage && <p className="session-message">{sessionMessage}</p>}
      {error && <p className="error-message">Error: {error}</p>}

      <div className="incidents-table">
        {incidents.length === 0 ? (
          <div className="no-incidents">No incidents found</div>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>Incident #</th>
                <th>Complainant</th>
                <th>Date</th>
                <th>Category</th>
                <th>Management Action</th>
                <th>Status/Action</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.incident_number || `INC-${incident.id}`}</td>
                  <td>{incident.complainant_name}</td>
                  <td>{incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{incident.category_name || incident.category || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(incident.recommendations)} ${
                      incident.recommendations === 'pending' ? 'bold-text' : ''
                    }`}>
                      {incident.recommendations || 'pending'}
                    </span>
                  </td>
                  <td className="text-small">
                    {getDisplayText(incident)}
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/*pagination should be placed here */}
          {totalPages > 1 && (
                      <div className="pagination">
          <button  onClick={() => setCurrentPage(prev => prev - 1)} 
            disabled = {currentPage === 1}
            >
           Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>

          {/*Next button - goes forward one page */}

          <button onClick={() => setCurrentPage(prev => prev + 1)}
             disabled = {currentPage === totalPages }
            >
           
          Next
          </button>
          </div>
          )}

         </>
        )}
        
      </div>

      {/* Incident Management Modal */}
      {selectedIncident && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Incident Management Action</h3>
            
            <div className="details-grid">
              <div className="detail-item">
                <strong>Incident #:</strong> {selectedIncident.incident_number || `INC-${selectedIncident.id}`}
              </div>
              <div className="detail-item">
                <strong>Complainant:</strong> {selectedIncident.complainant_name || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Category:</strong> {selectedIncident.category_name || selectedIncident.category || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Date:</strong> {selectedIncident.incident_date ? new Date(selectedIncident.incident_date).toLocaleDateString() : 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {selectedIncident.location || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Current Status:</strong> 
                <div className={`status-badge ${getStatusColor(selectedIncident.recommendations)} ${
                  selectedIncident.recommendations === 'pending' ? 'bold-text' : ''
                }`}>
                  {selectedIncident.recommendations || 'pending'}
                </div>
              </div>
              <div className="detail-item">
                <strong>SAPS #:</strong> {selectedIncident.ssaps_case_number || 'N/A'}
              </div>
              {selectedIncident.assigned_investigator_name && (
                <div className="detail-item">
                  <strong>Assigned Investigator:</strong> 
                  <div className="text-small">{selectedIncident.assigned_investigator_name}</div>
                </div>
              )}
              {selectedIncident.referred_department && (
                <div className="detail-item">
                  <strong>Referred Department:</strong> 
                  <div className="text-small">
                    {departments.find(d => d.id.toString() === selectedIncident.referred_department)?.name || selectedIncident.referred_department}
                  </div>
                </div>
              )}
              <div className="detail-item full-width">
                <strong>Details:</strong> 
                <div className="details-text">{selectedIncident.details || 'No details provided'}</div>
              </div>
            </div>

            <div className="action-section">
              <div className="assignment-grid">
                <div className="assignment-item">
                  <label htmlFor="managementAction">Management Action:</label>
                  <select
                    id="managementAction"
                    value={managementAction}
                    onChange={(e) => {
                      setManagementAction(e.target.value as any);
                      // Reset selections when action changes
                      if (e.target.value !== 'refer to preliminary') {
                        setSelectedInvestigator('');
                      }
                      if (e.target.value !== 'refer to department') {
                        setSelectedDepartment('');
                      }
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="close">Close Incident</option>
                    <option value="refer to preliminary">Refer to Preliminary Investigation</option>
                    <option value="refer to department">Refer to Department</option>
                  </select>
                </div>
                
                {/* Show investigator dropdown only when "refer to preliminary" is selected */}
                {managementAction === 'refer to preliminary' && (
                  <div className="assignment-item">
                    <label htmlFor="investigator">Assign Investigator:</label>
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
                
                {/* Show department dropdown only when "refer to department" is selected */}
                {managementAction === 'refer to department' && (
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
                <button className="cancel-btn" onClick={() => setSelectedIncident(null)}>
                  Cancel
                </button>
                <button 
                  className="update-btn" 
                  onClick={() => handleUpdate(selectedIncident.id)}
                  disabled={
                    (managementAction === 'refer to preliminary' && !selectedInvestigator) ||
                    (managementAction === 'refer to department' && !selectedDepartment)
                  }
                >
                  Apply Management Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};