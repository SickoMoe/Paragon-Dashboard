const RecentActivity: React.FC = () => {
  return (
    <div className="dashboard-section">
      <h2>Recent Activity</h2>
      <ul className="dashboard-list">
        <li className="dashboard-item">New auction created: Property X</li>
        <li className="dashboard-item">Bid canceled on auction: Property Y</li>
        {/* Additional recent activities */}
      </ul>
    </div>
  );
};

export default RecentActivity;
