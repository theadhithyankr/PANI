import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu,
  ChevronRight
} from 'lucide-react';
import Button from './Button';

const Header = ({ 
  onToggleSidebar, 
  pageName = '',
  breadcrumbs = []
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Page name and search section */}
      {pageName && (
        <div className="px-4 flex items-center justify-between" style={{ height: '65px' }}>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={onToggleSidebar}
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {breadcrumbs.length > 0 ? (
              <nav className="flex items-center space-x-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-3 h-3 mx-2 text-gray-400" />}
                    {crumb.href ? (
                      <button 
                        onClick={() => navigate(crumb.href)}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {crumb.name}
                      </button>
                    ) : (
                      <h1 className="text-xl font-semibold text-gray-900">{crumb.name}</h1>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              <h1 className="text-xl font-semibold text-gray-900">{pageName}</h1>
            )}
          </div>
          <div className="flex items-center space-x-4">
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
