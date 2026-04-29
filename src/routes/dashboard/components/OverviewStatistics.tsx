interface OverviewStatisticsProps {
  activeAuctions: number;
  completedAuctions: number;
  registeredUsers: number;
  totalRevenue: number;
}

const OverviewStatistics: React.FC<OverviewStatisticsProps> = ({
  activeAuctions,
  completedAuctions,
  registeredUsers,
  totalRevenue,
}) => {
  return (
    <div className="statistic-section">
      <ul className="statistic-item--statistics ">
        <li className="statistic-item">
          Total Active Auctions:
          <a className="statistic-item--link">{activeAuctions}</a>
        </li>
        <li className="statistic-item">
          Total Completed Auctions:
          <a className="statistic-item--link">{completedAuctions}</a>
        </li>
        <li className="statistic-item">
          Total Registered Users:
          <a className="statistic-item--link">{registeredUsers}</a>
        </li>
        <li className="statistic-item">
          Total Revenue Generated:
          <a className="statistic-item--link">{totalRevenue}</a>
        </li>
      </ul>
    </div>
  );
};
export default OverviewStatistics;
