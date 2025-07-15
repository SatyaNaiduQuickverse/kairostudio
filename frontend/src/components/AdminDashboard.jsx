import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Sun, 
  Moon, 
  BarChart3, 
  Search,
  Trash2,
  MessageSquare
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const contactsPerPage = 20;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * contactsPerPage;
      const params = {
        limit: contactsPerPage,
        offset,
        ...(filter !== 'all' && { status: filter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await axios.get('/api/admin/contacts', { params });
      setContacts(response.data.contacts);
      setTotalContacts(response.data.total);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [fetchContacts, fetchStats]);

  const updateContactStatus = async (id, status) => {
    try {
      await axios.patch(`/api/admin/contacts/${id}`, { status });
      fetchContacts();
      fetchStats();
    } catch (error) {
      alert('Failed to update contact status');
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await axios.delete(`/api/admin/contacts/${id}`);
      fetchContacts();
      fetchStats();
    } catch (error) {
      alert('Failed to delete contact');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const baseClasses = 'status-badge';
    const statusClasses = {
      new: 'status-new',
      read: 'status-read',
      replied: 'status-replied',
      archived: 'status-archived'
    };
    return `${baseClasses} ${statusClasses[status] || statusClasses.new} ${darkMode ? 'dark' : ''}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalContacts / contactsPerPage);

  return (
    <div className={`admin-container ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className={`dashboard-header ${darkMode ? 'dark' : ''}`}>
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-logo">
              <BarChart3 size={20} />
            </div>
            <div className="brand-text">
              <h1 className={darkMode ? 'dark' : ''}>Kairos Studio</h1>
              <p className={darkMode ? 'dark' : ''}>Admin Dashboard</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`theme-toggle ${darkMode ? 'dark' : ''}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          {[
            { label: 'Total Contacts', value: stats.total || 0, icon: '📊', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { label: 'New Messages', value: stats.new || 0, icon: '📬', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { label: 'Today', value: stats.today || 0, icon: '📅', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { label: 'This Week', value: stats.week || 0, icon: '📈', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { label: 'This Month', value: stats.month || 0, icon: '📋', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
          ].map((stat, index) => (
            <div key={index} className={`stat-card ${darkMode ? 'dark' : ''}`}>
              <div className="stat-content">
                <div className="stat-info">
                  <h3 className={darkMode ? 'dark' : ''}>{stat.value}</h3>
                  <p className={darkMode ? 'dark' : ''}>{stat.label}</p>
                </div>
                <div className="stat-icon" style={{ background: stat.gradient }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className={`controls-section ${darkMode ? 'dark' : ''}`}>
          <div className="controls-content">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearch}
                className={`search-input ${darkMode ? 'dark' : ''}`}
              />
            </div>
            
            <div className="filters">
              {[
                { id: 'all', name: 'All' },
                { id: 'new', name: 'New', badge: stats.new },
                { id: 'read', name: 'Read' },
                { id: 'replied', name: 'Replied' },
                { id: 'archived', name: 'Archived' }
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => {
                    setFilter(filterOption.id);
                    setCurrentPage(1);
                  }}
                  className={`filter-button ${filter === filterOption.id ? 'active' : ''} ${darkMode ? 'dark' : ''}`}
                >
                  {filterOption.name}
                  {filterOption.badge > 0 && (
                    <span className="filter-badge">{filterOption.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className={`contacts-section ${darkMode ? 'dark' : ''}`}>
          <div className={`section-header ${darkMode ? 'dark' : ''}`}>
            <h2 className={`section-title ${darkMode ? 'dark' : ''}`}>
              Contact Messages
              <span className={`contacts-count ${darkMode ? 'dark' : ''}`}>
                ({totalContacts} total)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="empty-state">
              <MessageSquare className={`empty-icon ${darkMode ? 'dark' : ''}`} size={48} />
              <h3 className={`empty-title ${darkMode ? 'dark' : ''}`}>No contacts found</h3>
              <p className={`empty-text ${darkMode ? 'dark' : ''}`}>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="contacts-table">
                <table className="table">
                  <thead className={`table-header ${darkMode ? 'dark' : ''}`}>
                    <tr>
                      <th className={darkMode ? 'dark' : ''}>Contact Info</th>
                      <th className={darkMode ? 'dark' : ''}>Message</th>
                      <th className={darkMode ? 'dark' : ''}>Date</th>
                      <th className={darkMode ? 'dark' : ''}>Status</th>
                      <th className={darkMode ? 'dark' : ''}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr key={contact.id} className={`table-row ${darkMode ? 'dark' : ''}`}>
                        <td className="table-cell">
                          <div className="contact-info">
                            <div className="contact-avatar">
                              {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="contact-details">
                              <h4 className={darkMode ? 'dark' : ''}>{contact.name}</h4>
                              <p className={darkMode ? 'dark' : ''}>{contact.email}</p>
                              {contact.phone && (
                                <p className={darkMode ? 'dark' : ''}>📞 {contact.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell message-cell">
                          <p className={`message-text ${darkMode ? 'dark' : ''}`}>
                            {contact.message}
                          </p>
                          {contact.notes && (
                            <p className={`message-note ${darkMode ? 'dark' : ''}`}>
                              Note: {contact.notes}
                            </p>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className={`date-text ${darkMode ? 'dark' : ''}`}>
                            {formatDate(contact.created_at)}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={getStatusColor(contact.status)}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="actions-cell">
                            <select
                              value={contact.status}
                              onChange={(e) => updateContactStatus(contact.id, e.target.value)}
                              className={`status-select ${darkMode ? 'dark' : ''}`}
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className={`delete-button ${darkMode ? 'dark' : ''}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`pagination ${darkMode ? 'dark' : ''}`}>
                  <div className={`pagination-info ${darkMode ? 'dark' : ''}`}>
                    Showing {(currentPage - 1) * contactsPerPage + 1} to{' '}
                    {Math.min(currentPage * contactsPerPage, totalContacts)} of {totalContacts} results
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`pagination-button ${darkMode ? 'dark' : ''}`}
                    >
                      Previous
                    </button>
                    <span className={`pagination-text ${darkMode ? 'dark' : ''}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`pagination-button ${darkMode ? 'dark' : ''}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
