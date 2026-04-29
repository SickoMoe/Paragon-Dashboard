const Notifications: React.FC = () => {
  return (
    <div className="dashboard-section">
      <h2>Notifications</h2>
      <ul className="dashboard-list">
        <li className="dashboard-item">
          Auction for Property Z is about to end.
        </li>
        <li className="dashboard-item">
          New bid placed on auction: Property W
        </li>
        {/* Additional notifications */}
      </ul>
    </div>
  );
};

export default Notifications;
