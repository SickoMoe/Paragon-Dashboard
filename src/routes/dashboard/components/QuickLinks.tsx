const QuickLinks: React.FC = () => {
  return (
    <div className="dashboard-section">
      <h2>Quick Links</h2>
      <ul className="dashboard-list">
        <li className="dashboard-item">
          <a href="#">Manage Auctions</a>
        </li>
        <li className="dashboard-item">
          <a href="#">Manage Properties</a>
        </li>
        <li className="dashboard-item">
          <a href="#">View Financial Transactions</a>
        </li>
        {/* Additional quick links */}
      </ul>
    </div>
  );
};

export default QuickLinks;
