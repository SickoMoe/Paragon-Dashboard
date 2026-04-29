const Sidebar = () => {
  const navItems = [
    { label: 'Home', path: '/' },
        { label: 'Login', path: '/login' },

    { label: 'Users', path: '/users' },
    { label: 'Auctions', path: '/manage-auctions' },
     { label: 'Sales', path: '/sales' },
    // { label: 'Documention', path: '' },
    // { label: 'Analytics', path: '' },
    // { label: 'Feedback', path: '' },
    // { label: 'System', path: '' },

    // Add more nav items as needed
  ];
  return (
    <nav className="sidebar">
      <b>-PG Paragon</b>
      <ul className="sidebar-menu">
        {navItems.map((item, index) => (
          <li key={index} className="sidebar-menu-item">
            <a href={item.path}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
