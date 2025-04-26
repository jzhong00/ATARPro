import { useNavigate } from 'react-router-dom';
import APITest from './APITest';

const FrontPage = () => {
  const navigate = useNavigate();

  const calculators = [
    {
      title: 'Single Student Calculator',
      description: 'Calculate ATAR for an individual student',
      path: '/student',
    },
    {
      title: 'Cohort Calculator',
      description: 'Calculate ATARs for multiple students',
      path: '/cohort',
    },
    {
      title: 'SET Plan Calculator',
      description: 'Estimate ATAR based on SET Plan self-assessment',
      path: '/setplan',
    },
    {
      title: 'Equivalent Calculator',
      description: 'Calculate equivalent scores across different systems',
      path: '/equivalent',
    },
    {
      title: 'Scaling Graphs',
      description: 'View scaling graphs for different subjects',
      path: '/scaling-graphs',
    },
  ];

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {calculators.map((calculator) => (
          <div
            key={calculator.path}
            className="bg-white rounded-lg shadow-md p-6 border border-transparent hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => navigate(calculator.path)}
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-700">{calculator.title}</h2>
            <p className="text-gray-600">{calculator.description}</p>
          </div>
        ))}
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Development Tools</h2>
          <APITest />
        </div>
      )}
    </div>
  );
};

export default FrontPage; 