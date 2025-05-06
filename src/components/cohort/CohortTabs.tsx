import { useNavigate, useLocation } from 'react-router-dom';

// Removed imports for specific views as they are no longer rendered here
// import ResultsTableView from './views/ResultsTableView'; 
// import RangedResultsView from './views/RangedResultsView';
// import AtarsView from './views/AtarsView';
// import RangedAtarsView from './views/RangedAtarsView';

// Removed placeholders and ViewProps interface
// interface ViewProps {
//   mappingsLoaded: boolean;
// }
// const PlaceholderView = ({ label, mappingsLoaded }: { label: string; mappingsLoaded: boolean }) => (
//   <div className="p-4">
//     {!mappingsLoaded && (
//       <div className="text-center text-gray-500 mb-2">Loading Mappings...</div>
//     )}
//     {label} View (To be implemented)
//   </div>
// );
// const DataUploadView = () => null; 
// const SchoolSummaryView = (props: ViewProps) => <PlaceholderView label="School Summary" {...props} />;

interface TabItem {
  key: string;
  label: string;
  path: string;
  // Removed component property: component: React.ComponentType<any>;
}

const CohortTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Removed state for mappingsLoaded and mappingError
  // const [mappingsLoaded, setMappingsLoaded] = useState(false);
  // const [mappingError, setMappingError] = useState<string | null>(null);

  // Removed useEffect for loading mappings
  // useEffect(() => { ... });
  const tabItems: TabItem[] = [
    { key: 'upload', label: 'Import Data', path: '/cohort/upload' }, 
    { key: 'results', label: 'Results', path: '/cohort/results' }, 
    { key: 'ranged-results', label: 'Ranged Results', path: '/cohort/ranged-results' }, 
    { key: 'atars', label: 'ATARs', path: '/cohort/atars' },
    { key: 'ranged-atars', label: 'Ranged ATARs', path: '/cohort/ranged-atars' },
    { key: 'summary', label: 'School Summary', path: '/cohort/summary' },
  ];

  const activeTab = tabItems.find(tab => location.pathname.startsWith(tab.path)) || tabItems[0];

  return (
    <div className="pb-5 flex justify-center">
      <div className="w-auto">
      {/* Navigation Tabs */}
      <div className="bg-white border-gray-200 border rounded-lg px-10">
        <nav className="flex justify-center -mb-px space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`
                flex-shrink-0 
                ${activeTab.key === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm
              `}
              aria-current={activeTab.key === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      </div>
      
      {/* Removed mappingError display */}
      
      {/* Removed ActiveComponent rendering section */}
      
    </div>
  );
};

export default CohortTabs; 